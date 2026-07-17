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

```bash
cd seo-aeo-kit/pdca
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# .env を編集して以下を設定:
#   GOOGLE_APPLICATION_CREDENTIALS=/絶対パス/service-account.json
#   GSC_SITE_URL=https://tigerlabo.com/        ← GSCのプロパティ表記と完全一致（ドメインプロパティなら sc-domain:tigerlabo.com）
#   GA4_PROPERTY_ID=123456789
```

## 5. 疎通確認

```bash
python fetch_search_console.py   # → data/gsc_YYYY-MM-DD.json ができ、クエリ一覧が表示されればOK
python fetch_ga4.py              # → data/ga4_YYYY-MM-DD.json ができればOK
python analyze.py                # → data/insights_YYYY-MM-DD.md（改善候補レポート）が生成されればOK
```

エラー時の典型:
- `403 PERMISSION_DENIED` → 手順2/3の権限付与漏れ、またはプロパティID/サイトURLの表記違い
- `API has not been used` → 手順1-2のAPI有効化漏れ（表示されるURLから有効化できる）
- GSCはデータ反映に最大2日の遅延があるため、`--days` の終端は自動で2日前になっている

## 6. 毎日自動で回す（Claude Code）

`daily-improve.md` へ。Claude Code のスケジュール実行（Routine / cron）から
毎朝1回、fetch → analyze → 改善提案 → commit/push を回す。
