# 新規LP 横展開 intake ＆ 段取り（2つ目以降のLP用）

タイガーラボLPで作った仕組みを、別のLP（例: Shunsuke LP）へ適用するための intake シートと手順。
**GCPのサービスアカウント（鍵）は使い回せる**ので、1つ目より大幅に速い。

対象LP名: ＿＿＿＿＿＿  ／  記入日: ＿＿＿＿

---

## A. まず教えてほしいこと（これが埋まれば私が作業できます）

### A-1. リポジトリ / ホスティング
- [ ] GitHubリポジトリ名（`owner/repo`）: ＿＿＿＿＿＿
- [ ] 独自ドメイン（公開URL）: `https://____________/`
- [ ] 公開方法（GitHub Pages / その他）: ＿＿＿＿＿＿

### A-2. LPの「確定事実」（llms.txt・JSON-LDに入れる。誇張NG・数字で）
- [ ] サービス/事業の名前: ＿＿＿＿＿＿
- [ ] 何を・誰向けに・いくらで（1〜2文）: ＿＿＿＿＿＿
- [ ] 提供者（会社名/個人名）: ＿＿＿＿＿＿
- [ ] 所在地 / 対応エリア: ＿＿＿＿＿＿
- [ ] 連絡・申込導線（フォームURL等）: ＿＿＿＿＿＿
- [ ] SNS等のURL（sameAs用）: ＿＿＿＿＿＿
- [ ] よくある質問 8〜15個（AIに聞かれる形）: 別紙 or 箇条書きで

### A-3. 計測アカウント
- [ ] GA4: 新規プロパティを作る？既存？（測定ID `G-____`）
- [ ] Search Console: 登録済み？未登録？

---

## B. 私がやる作業（リポジトリ接続後）
1. `templates/head-seo-aeo.html` をベースに `<head>` を構築（GA4タグ＋CV計測＋OGP＋JSON-LD）
2. `llms.txt` / `robots.txt` / `sitemap.xml` をA-2の事実で作成
3. `seo-aeo-kit/pdca/config.json` をこのLP用に作成（サイトURL＋GA4プロパティID）
   ※このLPが別リポジトリなら、そのリポジトリにキット一式をコピーして設置
4. `node seo-aeo-kit/scripts/validate-seo.mjs index.html` で全チェック通過を確認
5. コミット＆プッシュ（＋必要ならPR）

## C. あなたがやる作業（計測・鍵まわり）※1つ目より短い
1. **GA4**: このLP用のデータストリーム作成 → 測定IDをheadに反映 → `generate_lead` をキーイベント化
2. **Search Console**: プロパティ登録 → sitemap送信
3. **サービスアカウントの再利用（新規GCP作業は不要）**:
   - 既存 `seo-pdca-bot@tigerlabo-seo-pdca.iam.gserviceaccount.com` を、
   - このLPの **GSCに「制限付き」** ／ **GA4に「閲覧者」** で追加するだけ
4. **鍵の環境変数**:
   - このLPを**別のClaude Code環境**で回すなら、その環境に `GOOGLE_SERVICE_ACCOUNT_JSON_B64`（同じBase64でOK）を設定
   - 同じ環境で回すなら、config.json を切り替える運用にする（相談）

## D. 自動PDCA（このLP用）
- `seo-aeo-kit/pdca/daily-improve.md` の運用をこのLPにも適用
- 毎日実行のRoutineを、このLPのリポジトリ/環境向けに1つ作成
- データが溜まる1〜2週間後から改善候補が出る（1つ目と同じ）

---

### メモ：1つ目（タイガーラボLP）で確立済みの再利用資産
- SEO/AEOキット一式（テンプレ・チェックリスト・検査スクリプト）
- PDCAスクリプト（GSC/GA4取得・分析・bootstrap）
- GCPサービスアカウント＋鍵（**そのまま使い回し可**）
→ 2つ目以降は「事実の記入」と「計測アカウントの用意」が主な作業。
