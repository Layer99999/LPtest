#!/usr/bin/env python3
"""GA4 Data API から流入・エンゲージメント・CV（generate_lead）を取得して data/ に保存する。

使い方:
    python fetch_ga4.py [--days 28]

出力:
    data/ga4_YYYY-MM-DD.json  … {summary: {...}, channels: [...], events: [...], period: {...}}

前提: setup-ga4-gsc.md のセットアップ（サービスアカウント＋GA4閲覧者権限）が完了していること。
"""
import argparse
import datetime
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import DateRange, Dimension, Metric, RunReportRequest

DATA_DIR = Path(__file__).parent / "data"
CV_EVENT = "generate_lead"  # head テンプレのCTAクリックイベントと揃える


def run(client, prop, dimensions, metrics, start, end):
    req = RunReportRequest(
        property=f"properties/{prop}",
        date_ranges=[DateRange(start_date=start.isoformat(), end_date=end.isoformat())],
        dimensions=[Dimension(name=d) for d in dimensions],
        metrics=[Metric(name=m) for m in metrics],
    )
    resp = client.run_report(req)
    rows = []
    for r in resp.rows:
        row = {d: v.value for d, v in zip(dimensions, r.dimension_values)}
        row.update({m: v.value for m, v in zip(metrics, r.metric_values)})
        rows.append(row)
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=28, help="取得期間（日数）")
    args = parser.parse_args()

    load_dotenv(Path(__file__).parent / ".env")
    prop = os.environ.get("GA4_PROPERTY_ID")
    if not prop or not prop.isdigit():
        sys.exit("ERROR: GA4_PROPERTY_ID が未設定です（数字のプロパティID。測定ID G-XXXX ではない）")
    if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        sys.exit("ERROR: GOOGLE_APPLICATION_CREDENTIALS が未設定です（.env を確認）")

    end = datetime.date.today() - datetime.timedelta(days=1)
    start = end - datetime.timedelta(days=args.days - 1)
    client = BetaAnalyticsDataClient()

    summary_rows = run(client, prop, [], ["activeUsers", "newUsers", "sessions", "averageSessionDuration", "engagementRate"], start, end)
    channels = run(client, prop, ["sessionDefaultChannelGroup"], ["sessions", "activeUsers", "engagementRate"], start, end)
    events = run(client, prop, ["eventName"], ["eventCount"], start, end)

    cv_count = next((int(e["eventCount"]) for e in events if e["eventName"] == CV_EVENT), 0)

    result = {
        "property": prop,
        "period": {"start": start.isoformat(), "end": end.isoformat()},
        "summary": summary_rows[0] if summary_rows else {},
        "cv_event": CV_EVENT,
        "cv_count": cv_count,
        "channels": channels,
        "events": events,
    }

    DATA_DIR.mkdir(exist_ok=True)
    out = DATA_DIR / f"ga4_{datetime.date.today().isoformat()}.json"
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"OK: {out}")
    s = result["summary"]
    if s:
        print(f"  期間: {start} 〜 {end} / ユーザー {s.get('activeUsers')} / セッション {s.get('sessions')} / CV({CV_EVENT}) {cv_count}")
    if cv_count == 0:
        print(f"  ⚠ CVイベント '{CV_EVENT}' が0件。タグ未設置か、GA4のキーイベント設定を確認（launch-checklist.md 2節）")


if __name__ == "__main__":
    main()
