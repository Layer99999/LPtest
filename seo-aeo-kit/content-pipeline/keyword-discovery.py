#!/usr/bin/env python3
"""AIEO記事の種になるキーワードを発掘し、検索ボリューム/CPCで優先度をつける。

使い方:
    # Ubersuggest画面（Keyword Ideas等）から手動エクスポートしたCSVを取り込む（推奨・確実に動く）
    python keyword-discovery.py --csv path/to/ubersuggest-export.csv

    # Ubersuggest APIを直接叩く（要APIアクセス権のあるプラン。下記の注意を必ず読むこと）
    python keyword-discovery.py --seed "AI研修 費用" "AI導入 補助金"
    python keyword-discovery.py --seed-file seeds.txt

出力:
    data/keywords_YYYY-MM-DD.csv … keyword, volume, cpc, competition, opportunity_score
    上位15件をターミナルに表示（記事化の優先順位の目安）

opportunity_score の考え方:
    ボリュームが大きく、CPC・競合が低いキーワードほど高スコア。
    「広告で取ると高くつくが、記事で取れれば安く済む」キーワードを優先するための目安。

注意（Ubersuggest API）:
    Ubersuggestの公開APIは公式の仕様書が整備されておらず、エンドポイント・認証方式は
    契約プランや時期によって変わり得る（本スクリプトの既定値は一般に知られている
    app.neilpatel.com のエンドポイントを仮置きしたもので、動作を保証しない）。
    --seed / --seed-file を使う前に、UBERSUGGEST_API_BASE / UBERSUGGEST_API_KEY を
    実際のアカウントの値で確認すること。動かない場合はUbersuggestの画面から
    キーワードリストをCSVエクスポートし、--csv で読み込む方が確実。
"""
import argparse
import csv as csv_module
import datetime
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
API_BASE = os.environ.get("UBERSUGGEST_API_BASE", "https://app.neilpatel.com/api")
API_KEY = os.environ.get("UBERSUGGEST_API_KEY")
LOC_ID = os.environ.get("UBERSUGGEST_LOC_ID", "2392")  # 2392 = Japan（Google Ads geo target ID）
LANGUAGE = os.environ.get("UBERSUGGEST_LANGUAGE", "ja")


def opportunity_score(volume, cpc, competition):
    comp = competition if competition else 0.5
    return round(volume / (1 + comp * 4) / max(cpc, 0.1), 2)


def fetch_from_api(keyword):
    if not API_KEY:
        raise SystemExit(
            "ERROR: UBERSUGGEST_API_KEY が未設定です。.env を作るか環境変数で設定してください。\n"
            "       APIアクセスが無い/不明な場合は --csv でUbersuggest画面からのCSVエクスポートを使ってください。"
        )
    params = {"keyword": keyword, "language": LANGUAGE, "locId": LOC_ID}
    url = f"{API_BASE}/keyword_info?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {API_KEY}"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as e:
        raise SystemExit(
            f"ERROR: Ubersuggest APIの呼び出しに失敗しました（{e}）。\n"
            "       エンドポイント/認証方式が想定と違う可能性があります。アカウントのAPI設定を確認するか、\n"
            "       --csv でCSVエクスポートを使ってください。"
        )
    return {
        "keyword": keyword,
        "volume": data.get("search_volume") or data.get("volume") or 0,
        "cpc": data.get("cpc") or 0.0,
        "competition": data.get("seo_difficulty") or data.get("competition") or 0.0,
    }


def _to_float(s):
    return float(str(s).replace("$", "").replace(",", "").strip())


def load_from_csv(path):
    rows = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv_module.DictReader(f)

        def pick(row, *names):
            for n in names:
                if n in row and row[n] not in ("", None):
                    return row[n]
            return None

        for row in reader:
            kw = pick(row, "Keyword", "keyword")
            if not kw:
                continue
            vol = pick(row, "Volume", "Search Volume", "volume")
            cpc = pick(row, "CPC", "cpc")
            comp = pick(row, "Competition", "SD", "SEO Difficulty", "competition")
            comp_val = _to_float(comp) if comp else 0.0
            rows.append({
                "keyword": kw,
                "volume": int(_to_float(vol)) if vol else 0,
                "cpc": _to_float(cpc) if cpc else 0.0,
                # UbersuggestのSD/Competitionは0-100スケールのことが多いので0-1に正規化
                "competition": comp_val / 100 if comp_val > 1 else comp_val,
            })
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--seed", nargs="*", default=[], help="Ubersuggest APIに直接投げるシードキーワード")
    parser.add_argument("--seed-file", help="1行1キーワードのテキストファイル")
    parser.add_argument("--csv", help="Ubersuggest画面からエクスポートしたCSVファイル")
    args = parser.parse_args()

    rows = []
    if args.csv:
        rows.extend(load_from_csv(args.csv))

    seeds = list(args.seed)
    if args.seed_file:
        seeds.extend(
            line.strip() for line in Path(args.seed_file).read_text(encoding="utf-8").splitlines() if line.strip()
        )
    for kw in seeds:
        rows.append(fetch_from_api(kw))

    if not rows:
        raise SystemExit("ERROR: --csv か --seed/--seed-file のいずれかでキーワードを渡してください（-h で使い方）。")

    for r in rows:
        r["opportunity_score"] = opportunity_score(r["volume"], r["cpc"], r["competition"])
    rows.sort(key=lambda r: -r["opportunity_score"])

    DATA_DIR.mkdir(exist_ok=True)
    out = DATA_DIR / f"keywords_{datetime.date.today().isoformat()}.csv"
    with open(out, "w", newline="", encoding="utf-8") as f:
        writer = csv_module.DictWriter(f, fieldnames=["keyword", "volume", "cpc", "competition", "opportunity_score"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"OK: {out}（{len(rows)}件）")
    print("優先度順（opportunity_score = ボリューム大 × CPC/競合小 ほど高スコア。記事化の目安）:")
    for r in rows[:15]:
        print(f"  {r['opportunity_score']:>8.1f}  vol={r['volume']:>6} cpc=${r['cpc']:<6.2f} comp={r['competition']:.2f}  {r['keyword']}")


if __name__ == "__main__":
    main()
