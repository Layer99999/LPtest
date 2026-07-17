# LP公開前チェックリスト（SEO / AEO / 計測）

対象LP: ＿＿＿＿＿＿＿＿ ／ 実施日: ＿＿＿＿ ／ 実施者: ＿＿＿＿

> すべてにチェックが付くまで公開しない。機械検査は `node seo-aeo-kit/scripts/validate-seo.mjs index.html` で一括確認できる。

## 1. 基本SEO
- [ ] `<title>` が32文字前後で、固有名詞＋提供価値を含む
- [ ] `<meta name="description">` が80〜120文字で、誰向け・何を・いくらでが分かる
- [ ] `<link rel="canonical">` が本番URLと完全一致（末尾スラッシュ含む）
- [ ] `<html lang="ja">` になっている
- [ ] h1 は1ページに1つ。h1→h2→h3 の階層が飛んでいない
- [ ] すべての `<img>` に意味のある alt（装飾画像は alt=""）
- [ ] モバイル表示崩れなし（実機 or DevToolsで confirm）
- [ ] 表示速度: PageSpeed Insights でモバイル70点以上を目安

## 2. 計測（PDCAの土台。これが無いと改善が回らない）
- [ ] GA4タグ（gtag.js）が設置され、リアルタイムレポートに自分のアクセスが映る
- [ ] CTAクリックで `generate_lead` イベントが飛ぶ（DebugView で確認）
- [ ] GA4管理画面で `generate_lead` を「キーイベント」に設定済み
- [ ] Google Search Console にプロパティ登録済み（認証メタ or DNS）
- [ ] GSC に sitemap.xml を送信済み
- [ ] Bing Webmaster Tools 登録済み（ChatGPTの検索はBingベース。AEO上重要）

## 3. OGP / シェア
- [ ] og:image（1200×630）が用意され、絶対URLで指定されている
- [ ] X / Facebook のシェアデバッガでプレビューが正しく出る

## 4. AEO（詳細は aeo-checklist.md）
- [ ] JSON-LD が構文エラーなくパースできる（リッチリザルトテスト）
- [ ] Organization / WebSite / WebPage / FAQPage が入っている
- [ ] llms.txt がルートで200を返す
- [ ] robots.txt がAIボット（GPTBot, ClaudeBot, PerplexityBot等）を許可している

## 5. 導線・フォーム
- [ ] 全CTAリンクが正しい飛び先（シークレットウィンドウで確認）
- [ ] フォームがログイン不要で誰でも送信できる
- [ ] 送信テスト1件実施→通知が届く

## 6. 公開後24時間以内
- [ ] GSC で URL検査 →「インデックス登録をリクエスト」
- [ ] `site:ドメイン` でGoogleに載ったか確認（数日かかる場合あり）
- [ ] GA4に実データが入り始めたか確認
- [ ] `pdca/setup-ga4-gsc.md` に従いAPI連携を有効化 → 毎日改善の運用開始
