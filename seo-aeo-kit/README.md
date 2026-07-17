# SEO / AEO 共通実装キット（全LP共通）

タイガーラボの全LP（タイガーラボLP・Shunsuke LP・今後の新規LP）に共通で適用する、
**SEO対策のPDCA（毎日自動改善）** と **AEO対策（AI回答エンジン最適化）** の実装キット。

最終更新: 2026-07-16

---

## このキットの思想

1. **計測なくして改善なし** — GA4 と Google Search Console（GSC）が入っていないLPは改善できない。全LPに必ず入れる。
2. **AEOはSEOの上位互換ではなく並列** — 検索順位（SEO）と、ChatGPT/Claude/Perplexity等のAI回答に引用されること（AEO）は別の戦い。両方やる。
3. **PDCAは毎日・自動で回す** — GSC/GA4のデータを毎日取得→改善候補を自動抽出→Claude Code が改善案をLPに反映→commit/push。人間は承認と方針決定だけ。
4. **正直な申告** — dateModified や lastmod は実際に更新した日だけ動かす。水増しはAIにも検索エンジンにも見抜かれ、信頼を失う。

## ディレクトリ構成

```
seo-aeo-kit/
├── README.md                    ← このファイル
├── templates/                   ← 新規LP作成時にコピーして使う雛形
│   ├── head-seo-aeo.html        ← <head>一式（meta/OGP/JSON-LD/GA4/GSC）
│   ├── llms.txt.template        ← AI回答エンジン向けサマリー
│   ├── robots.txt.template      ← AIボット許可設定込み
│   └── sitemap.xml.template
├── checklists/
│   ├── launch-checklist.md      ← 公開前チェック（SEO/AEO/計測）
│   └── aeo-checklist.md         ← AEO専用チェック
├── pdca/                        ← ★毎日自動改善の仕組み
│   ├── setup-ga4-gsc.md         ← GA4/GSC API連携セットアップ手順（鍵の作り方まで）
│   ├── daily-improve.md         ← Claude Code 毎日改善ランブック
│   ├── fetch_search_console.py  ← GSC: クエリ別 順位/CTR/表示/クリック取得
│   ├── fetch_ga4.py             ← GA4: 流入/エンゲージメント/CV取得
│   ├── analyze.py               ← データ→改善候補の自動抽出
│   ├── requirements.txt
│   └── .env.example             ← 認証情報テンプレ（実物の鍵はコミット禁止）
└── scripts/
    └── validate-seo.mjs         ← LPのSEO/AEO要素を静的検査（node scripts/validate-seo.mjs <html>）
```

## 新規LPを作るときの手順（横展開）

1. `templates/head-seo-aeo.html` をベースに `<head>` を構成し、`{{...}}` プレースホルダを全て置換する。
2. `templates/llms.txt.template` / `robots.txt.template` / `sitemap.xml.template` を置換してルートに設置。
3. GA4で新しいデータストリームを作成し、測定ID（`G-XXXXXXXXXX`）を差し替える。CTAクリックを `generate_lead` イベントとして送る（head テンプレに実装例あり）。
4. GSCにプロパティ登録し、認証メタタグを差し替える。sitemap.xml を送信。
5. `node seo-aeo-kit/scripts/validate-seo.mjs index.html` で全項目パスを確認。
6. `checklists/launch-checklist.md` を上から順に消し込み、公開。
7. `pdca/setup-ga4-gsc.md` に従いAPI連携を有効化し、`pdca/daily-improve.md` の運用（毎日自動改善）を開始する。

## 既存LPに後付けする場合

このリポジトリ（タイガーラボLP）が適用済みの実例。`git log` でこのキット導入コミットの index.html 差分を見れば、
既存LPに何を足せばよいかがそのまま分かる。要点は：

- GA4タグ＋CVイベント（`generate_lead`）
- GSC認証メタ
- JSON-LD: `WebSite` + `SearchAction`、`FAQPage`、`speakable`
- llms.txt / robots.txt（AIボット許可）/ sitemap.xml

## PDCAの全体像（ツイートで話題の「毎日自動改善」）

```
毎朝（自動）
  ① fetch_search_console.py → 直近28日のクエリ別データ取得
  ② fetch_ga4.py            → 流入・CV・エンゲージメント取得
  ③ analyze.py              → 改善候補を自動抽出（順位11-20位×低CTR等）
  ④ Claude Code             → 候補を読み、title/meta/見出し/FAQを改善してcommit/push
人間（週1）
  ⑤ 改善履歴と数値の推移をレビュー、方針を調整
```

詳細は `pdca/daily-improve.md` を参照。
