#!/usr/bin/env python3
"""GSC/GA4の取得データから改善候補を自動抽出し、Markdownレポートを生成する。

使い方:
    python analyze.py            # data/ 内の最新の gsc_*.json / ga4_*.json を使う

出力:
    data/insights_YYYY-MM-DD.md  … Claude Code が読んで改善を実行するためのレポート

改善候補の抽出ロジック（daily-improve.md の判断基準と対応）:
    1. ALMOST   … 順位11〜20位 × 表示回数上位     → titleや見出しにクエリ語を組み込めば1ページ目が狙える
    2. LOW_CTR  … 順位1〜10位 × CTRが順位期待値の半分未満 → title/descriptionの見せ方で損している
    3. RISING   … 前回データ比で表示回数が急増         → 新しい需要。セクション/FAQ追加候補
    4. GA4      … CV0件・エンゲージメント低下などの警告
"""
import datetime
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

# 掲載順位ごとのCTR期待値のめやす（業界平均の丸め値）。これの50%を下回ったら LOW_CTR
EXPECTED_CTR = {1: 0.28, 2: 0.15, 3: 0.10, 4: 0.07, 5: 0.05, 6: 0.04, 7: 0.03, 8: 0.03, 9: 0.025, 10: 0.02}
MIN_IMPRESSIONS = 20  # これ未満のクエリはノイズとして無視


def latest(pattern):
    files = sorted(DATA_DIR.glob(pattern))
    return files[-1] if files else None


def previous(pattern):
    files = sorted(DATA_DIR.glob(pattern))
    return files[-2] if len(files) >= 2 else None


def load(path):
    return json.loads(path.read_text(encoding="utf-8")) if path else None


def analyze_gsc(gsc, prev_gsc):
    almost, low_ctr, rising = [], [], []
    prev_imp = {}
    if prev_gsc:
        prev_imp = {r["query"]: r["impressions"] for r in prev_gsc.get("queries", [])}

    for r in gsc.get("queries", []):
        q, pos, imp, ctr = r["query"], r["position"], r["impressions"], r["ctr"]
        if imp < MIN_IMPRESSIONS:
            continue
        if 11 <= pos <= 20:
            almost.append(r)
        elif pos <= 10:
            expected = EXPECTED_CTR.get(round(pos), 0.02)
            if ctr < expected * 0.5:
                low_ctr.append({**r, "expected_ctr": expected})
        if q in prev_imp and prev_imp[q] > 0 and imp >= prev_imp[q] * 2:
            rising.append({**r, "prev_impressions": prev_imp[q]})

    almost.sort(key=lambda r: -r["impressions"])
    low_ctr.sort(key=lambda r: -r["impressions"])
    rising.sort(key=lambda r: -r["impressions"])
    return almost[:5], low_ctr[:5], rising[:5]


def analyze_ga4(ga4):
    warnings = []
    if not ga4:
        warnings.append("GA4データなし（fetch_ga4.py 未実行 or 認証未設定）")
        return warnings
    if ga4.get("cv_count", 0) == 0:
        warnings.append(f"CVイベント '{ga4.get('cv_event')}' が期間中0件。計測設定かCTA導線を確認。")
    s = ga4.get("summary", {})
    try:
        er = float(s.get("engagementRate", 0))
        if er and er < 0.5:
            warnings.append(f"エンゲージメント率 {er:.0%} と低め。着地セクションと流入クエリの意図ズレを疑う。")
    except ValueError:
        pass
    return warnings


def fmt_rows(rows, extra=None):
    lines = []
    for r in rows:
        line = f"- `{r['query']}` … 順位 {r['position']} / 表示 {r['impressions']} / クリック {r['clicks']} / CTR {r['ctr']:.1%}"
        if extra:
            line += extra(r)
        lines.append(line)
    return lines or ["- （該当なし）"]


def main():
    today = datetime.date.today().isoformat()
    gsc = load(latest("gsc_*.json"))
    ga4 = load(latest("ga4_*.json"))
    prev_gsc = load(previous("gsc_*.json"))

    if not gsc:
        raise SystemExit("ERROR: data/gsc_*.json がありません。先に fetch_search_console.py を実行してください。")

    almost, low_ctr, rising = analyze_gsc(gsc, prev_gsc)
    ga4_warnings = analyze_ga4(ga4)

    md = [f"# SEO改善インサイト {today}", ""]
    md += [f"データ期間: GSC {gsc['period']['start']}〜{gsc['period']['end']}" + (f" / GA4 {ga4['period']['start']}〜{ga4['period']['end']}" if ga4 else ""), ""]

    md += ["## 今日の改善候補（この中から最大2件だけ着手する）", ""]
    md += ["### 1. あと一歩クエリ（順位11〜20位・1ページ目が狙える）",
           "→ 打ち手: クエリの語を title / h2 / FAQ に自然に組み込む", ""]
    md += fmt_rows(almost)
    md += ["", "### 2. CTRが低いクエリ（順位は良いのに見せ方で損）",
           "→ 打ち手: title / description をクエリ意図に合わせ書き直す", ""]
    md += fmt_rows(low_ctr, extra=lambda r: f"（期待CTR {r['expected_ctr']:.0%}）")
    md += ["", "### 3. 表示急増クエリ（新しい需要）",
           "→ 打ち手: 対応セクション / FAQ を追加", ""]
    md += fmt_rows(rising, extra=lambda r: f"（前回表示 {r['prev_impressions']}）")

    md += ["", "## GA4 警告", ""]
    md += [f"- {w}" for w in ga4_warnings] or ["- なし"]

    md += ["", "## 実行メモ（Claudeが記入）", "", "- 変更した箇所と理由:", "- 見送った候補と理由:", ""]

    DATA_DIR.mkdir(exist_ok=True)
    out = DATA_DIR / f"insights_{today}.md"
    out.write_text("\n".join(md), encoding="utf-8")
    print(f"OK: {out}")
    print(f"  あと一歩 {len(almost)}件 / 低CTR {len(low_ctr)}件 / 急増 {len(rising)}件 / GA4警告 {len(ga4_warnings)}件")


if __name__ == "__main__":
    main()
