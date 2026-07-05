# LPtest — 生成AI導入支援サービス LP

株式会社タイガーラボの「中小企業向け 生成AI導入支援サービス」ランディングページです。
1ページ完結の静的サイト（ビルド工程なし）で、GitHub Pages での公開を予定しています。

## ファイル構成

| ファイル | 役割 |
|---|---|
| `index.html` | LP本体（CSS・JS・favicon・構造化データをすべてインライン保持） |
| `robots.txt` | クローラー制御。Sitemap 行は公開URL確定待ちでコメントアウト中 |
| `sitemap.xml` | サイトマップ。`<loc>` は公開URL確定待ちのプレースホルダ |
| `CLAUDE.md` | Claude Code 用のプロジェクト知識（編集ルール・不変条件） |
| `.claude/` | Claude Code の設定・スキル（公開前チェック手順など） |
| `docs/` | 監査レポート等の資料 |

## 動作確認

ブラウザで `index.html` を開くだけで確認できます（サーバ不要）。

```bash
# ローカル配信したい場合
python3 -m http.server 8000
```

## 公開前チェックリスト（未完了）

現在は**公開準備中**の状態です。公開前に以下が必要です。詳細な手順は
`.claude/skills/publish-check/SKILL.md`（Claude Code なら「公開前チェックをして」で実行）を参照してください。

- [ ] 公開URLの確定（プロジェクトページ or 独自ドメイン）
- [ ] canonical / og:url / sitemap.xml / robots.txt のURL一括差し替え（プレースホルダ「あなたの公開URL」を全置換）
- [ ] OGP画像（1200×630px）の作成と `og:image` / `twitter:image` の設定
- [ ] 問い合わせフォームURLの確定とCTA有効化（現在「受付フォームを準備中です」で無効）
- [ ] プライバシーポリシーのお問い合わせ窓口の記載
- [ ] 特定商取引法に基づく表記の整備
- [ ] Google Search Console への sitemap 送信・OGP/リッチリザルトの検証

## 編集ルール

- コミットメッセージは変更内容が分かる日本語で書く（「Add files via upload」禁止）
- main へ直接コミットせず、作業ブランチ → Pull Request でマージする
- `index.html` の丸ごと上書きアップロードは禁止（過去に改稿約1,400行が消失した事故あり。詳細は `docs/audit-2026-07-05.md` 参照）
