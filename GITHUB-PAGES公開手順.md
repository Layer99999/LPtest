# 会社LP 公開手順（GitHub Pages ＋ tigerlabo.com）

最終更新: 2026-07-15 ／ 公開先: GitHub Pages（repo: `Layer99999/LPtest`）＋ カスタムドメイン `tigerlabo.com`
アップロード元: `~/Desktop/tigerlabo-LP公開用/`（＝ `dist/` と同一）

> 前提の注意：現在 repo `LPtest` に入っている index.html は**2週間前の古い下書き**（別内容）。下記でアップする最新版に**全ファイル置き換え**する。

---

## STEP 1. repo に最新ファイルをアップロード（Shinya／GitHub Web）
`Layer99999/LPtest` の **Add file → Upload files** で、`~/Desktop/tigerlabo-LP公開用/` の中身を**まるごと**アップ（同名ファイルは上書きされる）。

アップするもの（7点）:
- `index.html`（最新版・上書き）
- `robots.txt`（上書き）
- `sitemap.xml`（上書き）
- `llms.txt`（新規）
- `assets/og-image.png`（新規・フォルダごと）
- `CNAME`（新規・中身は `tigerlabo.com`）※カスタムドメイン宣言
- `.nojekyll`（新規・空ファイル）※GitHubの自動変換を止めて静的HTMLをそのまま配信

> `assets` フォルダは、アップロード画面に `assets/og-image.png` をドラッグすればフォルダごと作られる。`.nojekyll` はドット始まりで隠れやすいので、Finderで「⌘+Shift+.」で不可視ファイルを表示してからドラッグ。

コミットして完了。

## STEP 2. GitHub Pages を有効化（Shinya／GitHub Web）
repo → **Settings → Pages**:
- **Source**: Deploy from a branch
- **Branch**: `main` / `/(root)` → Save
- **Custom domain**: `tigerlabo.com` と入力して Save（CNAMEファイルがあるので自動認識される）
- 「DNS check」が出る。DNSを STEP 3 で設定するとチェックが通る。
- 通った後に **Enforce HTTPS** にチェック（GitHubが無料SSLを自動発行。数分〜1時間）。

## STEP 3. DNS を GitHub Pages に向け替え（Shinya／ConoHaコントロールパネル）
ConoHa の DNS 設定で、**tigerlabo.com の Web の向き先だけ**変更する。**メール（MX）や SPF/DKIM の TXT は絶対に触らない**（M365メールが止まる）。

### 変更する（Web用）
| 種別 | ホスト | 現在 | 変更後 |
|---|---|---|---|
| A | `@`（tigerlabo.com） | 118.27.122.22（ConoHa） | **下記4件のGitHub IPに置き換え** |
| A/CNAME | `www` | 118.27.122.22 | **CNAME → `layer99999.github.io`** |

apex（`@`）の A レコード4件（GitHub Pages 公式）:
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```
（任意でIPv6 AAAAも: `2606:50c0:8000::153` / `...8001::153` / `...8002::153` / `...8003::153`）

### 触らない（そのまま残す）
- **MX**（`...mail.protection.outlook.com`）＝メール
- **TXT**（SPF `v=spf1...` / DKIM / DMARC）＝メール認証

### （任意・推奨）ドメイン乗っ取り防止の確認
repo Settings → Pages で「Verify domain」を使う場合、指示される `_github-pages-challenge-Layer99999` の TXT を1件追加。無くても公開はできる。

## STEP 4. 公開後チェック
- `https://tigerlabo.com/` が最新LPで開く／鍵マーク（SSL）OK（DNS反映まで最大数時間）。
- `https://tigerlabo.com/robots.txt` `/sitemap.xml` `/llms.txt` `/assets/og-image.png` が開ける。
- **シークレットウィンドウ**で無料相談フォーム（LP内ボタン）を開き、**ログイン不要で誰でも回答できる**か確認（社内限定だとリード0）。ダメなら `open-form-to-everyone.gs` を適用。
- OGP: X/FacebookのシェアデバッガでOG画像が出るか。
- Google Search Console / Bing Webmaster に登録 → `sitemap.xml` を送信。
- リッチリザルトテストで FAQPage / Organization を検証。

---

## メモ
- 今後LPを直すときは編集用ソース `lp/index.html` を直す → `dist/` を作り直す → repoに再アップ（同名上書き）。
- 公開先は **GitHub Pages に一本化**。ConoHa WING側にはWebを置かない（DNSがGitHubを向くため）。メールはM365のまま不変。
- canonical・OGP・JSON-LDは `tigerlabo.com` 前提で作成済み＝この構成（apex+カスタムドメイン）でURLが一致する。
