# AEOチェックリスト（AI回答エンジン最適化）

AEO = Answer Engine Optimization。ChatGPT / Claude / Perplexity / Google AIモード等の
**AI回答の中で自社が正しく引用・推薦される**ための最適化。

## A. クロール許可（入口。拒否していたら他の全てが無意味）
- [ ] robots.txt で以下を許可: `OAI-SearchBot` `ChatGPT-User` `Claude-SearchBot` `Claude-User` `PerplexityBot` `Perplexity-User` `Google-Extended`
- [ ] 学習系（`GPTBot` `ClaudeBot` `CCBot`）の許可/拒否を方針として決めて明記
- [ ] CDN・WAF（Cloudflare等）のボット対策がAIボットをブロックしていない
- [ ] JSやログイン無しでも本文が読める（AIボットの多くはJSを実行しない。重要情報はHTMLに直書き）

## B. 構造化データ（AIが「事実」として拾う層）
- [ ] Organization: name / address / 連絡手段 / sameAs（SNS）/ alternateName（表記ゆれ）
- [ ] WebSite + WebPage（datePublished / dateModified が正直）
- [ ] FAQPage: 8〜15問。「AIに聞かれる形」の自然文の質問
- [ ] Service / Offer: 価格を数字で（minPrice + priceCurrency）
- [ ] speakable: h1・リード文を指定
- [ ] リッチリザルトテストでエラー0

## C. llms.txt（AI向けサイト要約）
- [ ] ルート直下に設置され200を返す
- [ ] 1〜2文の要約（それだけ引用されても成立する密度）
- [ ] 確定事実（社名/所在地/代表/価格/連絡手段）が本文・JSON-LDと完全一致
- [ ] 最終更新日を記載し、実更新時に動かしている

## D. コンテンツの書き方（引用されやすさ）
- [ ] 各セクション冒頭に「結論の1文」がある（AIは冒頭文を抜粋しがち）
- [ ] 価格・期間・実績は数字で書く（「低価格」ではなく「20万円〜」）
- [ ] 質問見出し（「〜とは？」「いくら？」）＋直下に簡潔な答え
- [ ] 会社名の表記ゆれ（カナ/英字/略称）を alternateName とページ内に自然に含める
- [ ] 一次情報源（公式サイト・公的機関）への発リンクがある（信頼シグナル）
- [ ] 誇張・未確定の記述がない（AIは複数ソースを突合する。矛盾は引用落ちの原因）

## E. 検証（四半期ごと＋大きな更新後）
- [ ] ChatGPT（検索ON）に「{{会社名}}とは」「{{地域/業種}} {{サービス}} おすすめ」を聞き、引用されるか記録
- [ ] Perplexity で同様に確認（出典リンクに自社が出るか）
- [ ] Claude（Web検索）で同様に確認
- [ ] Google「AIによる概要」で指名検索・サービス検索を確認
- [ ] 引用された/されなかったクエリを記録し、FAQ・llms.txt に反映（AEO版PDCA）

## 記録テーブル（コピーして使う）
| 日付 | エンジン | 質問 | 引用有無 | 引用内容/出典位置 | 対応 |
|---|---|---|---|---|---|
| | | | | | |
