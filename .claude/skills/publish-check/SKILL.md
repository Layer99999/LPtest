---
name: publish-check
description: GitHub Pages 公開前の最終チェックと公開URL差し替え。「公開前チェック」「公開URLが決まった」「公開準備」「デプロイ」と言われたら使用する。
---

# 公開前チェック・URL差し替え手順

## 前提確認（最初に必ず行う）
1. ユーザーに**公開URL**を確認する。未確定なら差し替え作業は行わず、「URL確定が公開のブロッカー」であることを伝えて中断する。
2. URLの形式を判定する：
   - **プロジェクトページ**（`https://ユーザー名.github.io/リポジトリ名/`）の場合：robots.txt はホストルートに置けないため Sitemap 行は機能しない。robots.txt のコメントをその旨に書き換え、Google Search Console への sitemap.xml 直接送信を正とする運用を案内する。
   - **ユーザーサイト or 独自ドメイン**の場合：robots.txt の Sitemap 行を有効化できる。独自ドメインなら CNAME ファイルの追加も必要。
3. URL は**末尾スラッシュ込みの絶対URL**で全箇所統一する。

## URL差し替え（5点セット・一括で行う）
1. `index.html` の canonical（コメントアウト中の `<link rel="canonical">`）を有効化し実URLを設定
2. `index.html` の OGP：`og:url` を canonical と同一値で追加。OGP画像（1200×630px）があれば `og:image` / `twitter:image` を絶対URLで追加。**画像がまだ無い場合は `twitter:card` を `summary` に変更**する（summary_large_image のまま画像なしは NG）
3. `sitemap.xml`：`<loc>` を実URLに差し替え、`<lastmod>` を当日日付に更新
4. `robots.txt`：Sitemap 行のコメントを外し実URLに差し替え（プロジェクトページの場合は前述の代替運用）
5. `index.html` の JSON-LD（ProfessionalService）：`"url"` プロパティを追加

## 残存チェック（差し替え後に必ず実行）
```bash
grep -n 'あなたの公開URL' index.html robots.txt sitemap.xml   # → 0件であること
grep -n 'aria-disabled' index.html                              # → CTA が無効のままなら要対応
grep -n '準備中' index.html                                     # → フォーム・窓口の暫定文言チェック
```

## 公開ブロッカー（未解消なら公開を止めてユーザーに報告）
- [ ] 問い合わせフォームURLが確定し、CTA（`href="#"` + `aria-disabled` + インラインstyle）が実リンクに差し替え済みか。**フォームも代替連絡先（mailto等）も無い状態での公開・集客開始は不可**
- [ ] プライバシーポリシー第6項「お問い合わせ窓口は現在準備中」に実際の連絡先が記載されたか（フォーム公開＝個人情報取得開始と同時に法的に必要）
- [ ] 特定商取引法に基づく表記（事業者名・所在地・連絡先・料金・支払方法・解約条件）の有無をユーザーに確認したか

## 公開後の確認を案内
- Google Search Console に sitemap.xml を送信
- X の Card Validator / Facebook シェアデバッガーで OGP 表示を確認
- Google リッチリザルトテストで JSON-LD を検証
- 公開版に `v1.0` 等のタグを打つことを提案
