#!/usr/bin/env python3
"""Search Console からクエリ別・ページ別の検索パフォーマンスを取得して data/ に保存する。

使い方:
    python fetch_search_console.py [--days 28]

出力:
    data/gsc_YYYY-MM-DD.json  … {queries: [...], pages: [...], period: {...}}

前提: setup-ga4-gsc.md のセットアップ（サービスアカウント＋GSC権限付与）が完了していること。
"""
import argparse
import datetime
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]
DATA_DIR = Path(__file__).parent / "data"
ROW_LIMIT = 250  # LP1枚の運用では十分。増やしたければ最大25000まで


def get_service():
    creds_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if not creds_path or not Path(creds_path).exists():
        sys.exit("ERROR: GOOGLE_APPLICATION_CREDENTIALS が未設定か、鍵ファイルが見つかりません（.env を確認）")
    creds = service_account.Credentials.from_service_account_file(creds_path, scopes=SCOPES)
    return build("searchconsole", "v1", credentials=creds)


def query(service, site_url, start, end, dimension):
    body = {
        "startDate": start.isoformat(),
        "endDate": end.isoformat(),
        "dimensions": [dimension],
        "rowLimit": ROW_LIMIT,
    }
    resp = service.searchanalytics().query(siteUrl=site_url, body=body).execute()
    rows = []
    for r in resp.get("rows", []):
        rows.append({
            dimension: r["keys"][0],
            "clicks": r["clicks"],
            "impressions": r["impressions"],
            "ctr": round(r["ctr"], 4),
            "position": round(r["position"], 1),
        })
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=28, help="取得期間（日数）")
    args = parser.parse_args()

    load_dotenv(Path(__file__).parent / ".env")
    site_url = os.environ.get("GSC_SITE_URL")
    if not site_url:
        sys.exit("ERROR: GSC_SITE_URL が未設定です（.env を確認）")

    # GSCのデータは最大2日遅れるため、終端は2日前
    end = datetime.date.today() - datetime.timedelta(days=2)
    start = end - datetime.timedelta(days=args.days - 1)

    service = get_service()
    result = {
        "site": site_url,
        "period": {"start": start.isoformat(), "end": end.isoformat()},
        "queries": query(service, site_url, start, end, "query"),
        "pages": query(service, site_url, start, end, "page"),
    }

    DATA_DIR.mkdir(exist_ok=True)
    out = DATA_DIR / f"gsc_{datetime.date.today().isoformat()}.json"
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"OK: {out}")
    print(f"  期間: {start} 〜 {end} / クエリ {len(result['queries'])}件 / ページ {len(result['pages'])}件")
    for row in sorted(result["queries"], key=lambda r: -r["impressions"])[:10]:
        print(f"  [{row['position']:>5}] imp={row['impressions']:>6} click={row['clicks']:>4} ctr={row['ctr']:.1%}  {row['query']}")


if __name__ == "__main__":
    main()
