# GA4 / Search Console API 連携セットアップ手順

「毎日自動改善」を動かすための鍵と権限の準備。所要30分程度・1回だけの作業。
以降は `daily-improve.md` の運用に入る。

## 0. 前提
- GA4プロパティとSearch Consoleプロパティが作成済みであること（未作成なら checklists/launch-checklist.md の「計測」節を先に）。
- Googleアカウント（tigerlabo管理者）でGoogle Cloudにアクセスできること。

## 1. Google Cloud プロジェクトとサービスアカウント作成

1. https://console.cloud.google.com/ → プロジェクト作成（例: `tigerlabo-seo-pdca`）
2. 「APIとサービス → ライブラリ」で以下2つを**有効化**:
   - **Google Search Console API**
   - **Google Analytics Data API**
3. 「IAMと管理 → サービスアカウント → 作成」
   - 名前例: `seo-pdca-bot`
   - ロールは不要（後でGA4/GSC側から個別に権限を与えるため）
4. 作成したサービスアカウントを開き「キー → 鍵を追加 → JSON」→ ダウンロード。
   - このJSONファイルが**鍵**。`service-account.json` にリネームして安全な場所へ。
   - ⚠️ **絶対にgitにコミットしない**（このキットの .gitignore 推奨設定参照）。

## 2. Search Console に権限付与

1. https://search.google.com/search-console → 対象プロパティ → 設定 → ユーザーと権限
2. 「ユーザーを追加」→ サービスアカウントのメールアドレス（`seo-pdca-bot@....iam.gserviceaccount.com`）を**「フル」または「制限付き」**で追加。
   - データ読み取りだけなら「制限付き」で十分。

## 3. GA4 に権限付与

1. GA4 → 管理 → プロパティのアクセス管理
2. 「＋」→ ユーザーを追加 → サービスアカウントのメールアドレスを**「閲覧者」**で追加。
3. GA4のプロパティIDを控える（管理 → プロパティ設定 → プロパティID。数字9桁前後。**測定ID G-XXXX とは別物**）。

## 4. 実行環境の設定

サイトURLとGA4プロパティIDは **config.json に記載済み**（tigerlabo は設定済み）。用意するのは**鍵だけ**。

### 【推奨】クラウド運用（Claude Code の環境）
Claude Code環境の環境変数は `.env` 形式（1行1組・改行不可）。鍵JSONは複数行なので、**Base64（1行）に変換**して入れる。

1. 鍵をBase64化（Macのターミナルで1回・結果がクリップボードに入る）:
   ```bash
   base64 -i ~/Downloads/tigerlabo-seo-pdca-*.json | tr -d '\n' | pbcopy
   ```
2. 環境の設定 → **環境変数** に1行追加（値はクォートで囲まない）:
   ```
   GOOGLE_SERVICE_ACCOUNT_JSON_B64=（上でコピーしたBase64文字列を貼り付け）
   ```
   - ※チャットやリポジトリには貼らない。環境変数にだけ入れる。
   - 開き方: 画面上の「環境名が出ているクラウドアイコン」をクリック → 環境にマウスを乗せ → 右に出る歯車（設定）アイコン。
3. 依存は毎回 `bash seo-aeo-kit/pdca/bootstrap.sh` が用意する（Routineの中で自動実行）。

> 注意: Claude Code環境には現状「専用のシークレット保管庫」が無く、環境変数は環境を編集できる人に見えます。
> 個人環境なら実質あなただけ。鍵はGSC/GA4の**読み取り専用**なので影響は限定的です。

### ローカル運用（自分のPCで回す場合）
```bash
cd seo-aeo-kit/pdca
bash bootstrap.sh
cp .env.example .env
# .env に鍵ファイルの絶対パスを設定:
#   GOOGLE_APPLICATION_CREDENTIALS=/絶対パス/service-account.json
```
別サイトに使い回すときは config.json の gsc_site_url / ga4_property_id を書き換える
（ドメインプロパティなら gsc_site_url は `sc-domain:example.com`）。

## 5. 疎通確認

```bash
cd seo-aeo-kit/pdca
python3 fetch_search_console.py   # → data/gsc_YYYY-MM-DD.json ができ、クエリ一覧が表示されればOK
python3 fetch_ga4.py              # → data/ga4_YYYY-MM-DD.json ができればOK
python3 analyze.py                # → data/insights_YYYY-MM-DD.md（改善候補レポート）が生成されればOK
```

※ サイトを登録したばかりの時期は、GSCにデータが溜まるまで（目安1〜2週間）クエリは0件のことがある。
　その場合でもスクリプトはエラーにならず「該当なし」で正常終了する（配管の確認はこれでOK）。

エラー時の典型:
- `403 PERMISSION_DENIED` → 手順2/3の権限付与漏れ、またはプロパティID/サイトURLの表記違い
- `API has not been used` → 手順1-2のAPI有効化漏れ（表示されるURLから有効化できる）
- GSCはデータ反映に最大2日の遅延があるため、`--days` の終端は自動で2日前になっている

## 6. 毎日自動で回す（Claude Code）

`daily-improve.md` へ。Claude Code のスケジュール実行（Routine / cron）から
毎朝1回、fetch → analyze → 改善提案 → commit/push を回す。
