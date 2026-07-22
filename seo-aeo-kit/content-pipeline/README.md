# コンテンツパイプライン（AIEO記事量産）

ブログ記事がChatGPT/Perplexity等のAI回答に引用される状態を作るための、
**発掘 → 執筆 → 引用** のパイプライン。既存の `seo-aeo-kit` (LPのSEO/AEO・毎日PDCA) に追加する形の仕組み。

最終更新: 2026-07-22

## スコープ（今回やらないこと）

**Google広告との連携（検索語句レポートからのネタ出し／引用増加に応じた広告費の自動削減）は対象外。**
発掘はUbersuggestのみで行う。将来Google Ads連携を足す場合は、このREADMEに④として追記する。

## サイクル

```
① 発掘   keyword-discovery.py で検索ボリューム/CPCを取得し、記事化の優先順位をつける
② 執筆   article-template.md に沿って質問形見出し＋結論ファーストで書く
③ 引用   公開後、aeo-checklist.md の「E. 検証」でAIに実際に聞いて引用有無を記録する
```

## ディレクトリ

```
content-pipeline/
├── README.md              ← このファイル
├── keyword-discovery.py   ← ①発掘: Ubersuggest CSV/APIからキーワード候補を優先度つきで抽出
├── article-template.md    ← ②執筆: AIEO記事テンプレート＋執筆ルール＋JSON-LD雛形
├── validate-article.mjs   ← 記事の書き方をAIEO観点で静的検査
├── .env.example            ← Ubersuggest APIキーの設定例（--seed使用時のみ必要）
└── data/                   ← keyword-discovery.pyの出力（git管理外）
```

## 使い方

### ① 発掘

Ubersuggestの画面（Keyword Ideas等）から手動でCSVエクスポートするのが最も確実:

```bash
python3 seo-aeo-kit/content-pipeline/keyword-discovery.py --csv ~/Downloads/ubersuggest-export.csv
```

APIアクセスがある場合は直接シードキーワードを渡すこともできる（`.env.example` を `.env` にコピーして `UBERSUGGEST_API_KEY` を設定。
エンドポイント仕様は変わりうるため、動かない場合はCSV取り込みを使うこと。詳細はスクリプト冒頭のコメント参照）:

```bash
python3 seo-aeo-kit/content-pipeline/keyword-discovery.py --seed "AI研修 費用" "AI導入 補助金"
```

出力される `opportunity_score`（ボリューム大 × CPC/競合小ほど高スコア）の上位から記事化する。

### ② 執筆

`article-template.md` をコピーして1記事分書く。ポイントは3つ:
- 見出しは質問形（「〜とは？」「いくら？」）
- 見出し直後の1〜2文で結論を即答（前置きなし。LLMは記事冒頭を優先的に引用する）
- FAQを本文とJSON-LD(FAQPage)の両方に、同じ内容で3問以上入れる

`<head>` は `seo-aeo-kit/templates/head-seo-aeo.html` を流用し、JSON-LDの `@graph` に
`article-template.md` 末尾の Article + FAQPage ブロックを追加する（Organization/WebSiteの`@id`は既存を再利用）。

公開前に両方の検査をPASSさせる:

```bash
node seo-aeo-kit/scripts/validate-seo.mjs <記事のパス>            # head部分の共通チェック
node seo-aeo-kit/content-pipeline/validate-article.mjs <記事のパス>  # 見出し/リード文/FAQ等
```

### ③ 引用

公開1〜2週間後を目安に、`checklists/aeo-checklist.md` の「E. 検証」の手順でChatGPT/Perplexity/Claude/Google AI概要に
実際に聞いて引用有無を記録する。同チェックリストの記録テーブルをそのまま使う（LP全体と記事を区別したい場合は
「対象ページ」列を追加してよい）。

引用されても問い合わせに繋がらない記事（技術的に深すぎる等）は、各セクション末尾のCTA（次のアクション）を見直す。
