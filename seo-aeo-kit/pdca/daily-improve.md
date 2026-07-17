# 毎日自動改善ランブック（Claude Code × GA4 × Search Console）

GSC/GA4のデータを毎日取得し、Claude Code が改善候補を分析してLPを直し、commit/push するPDCAの運用手順。
セットアップ（鍵・権限）が未了なら先に `setup-ga4-gsc.md`。

## PDCAサイクル

| フェーズ | 何をするか | 担当 |
|---|---|---|
| **P**lan | analyze.py が改善候補を自動抽出 → Claudeが優先度をつけ改善案を作る | 自動 |
| **D**o | title/meta/見出し/FAQ/llms.txt を修正、dateModified/lastmod を同期、commit/push | 自動 |
| **C**heck | 翌日以降のデータで効果を確認（同スクリプトが前回比を出す） | 自動 |
| **A**ct | 効いた変更は横展開、効かなかった変更は差し戻し検討。週1で人間がレビュー | 人間 |

## 毎日実行するプロンプト（Claude Code に渡す定型指示）

Claude Code のスケジュール実行（Routine）に以下を登録する:

```
SEO/AEOの毎日改善を実行してください。
0. `bash seo-aeo-kit/pdca/bootstrap.sh` で依存を用意（数十秒）
1. `cd seo-aeo-kit/pdca && python3 fetch_search_console.py && python3 fetch_ga4.py && python3 analyze.py` を実行
   （認証は環境変数 GOOGLE_SERVICE_ACCOUNT_JSON、サイト/プロパティは config.json から自動で読まれる）
2. 生成された data/insights_*.md（最新）を読む
3. 「今日の改善候補」から最大2件だけ選び、index.html / llms.txt に反映する。
   守るルール:
   - 事実を変えない（価格・住所・実績・サービス内容の改変は禁止。表現の改善のみ）
   - title は32文字前後、description は80〜120文字を維持
   - FAQを追加する場合は llms.txt の既存事実の範囲内で書く
   - 変更したら JSON-LD の dateModified と sitemap.xml の lastmod を今日の日付に同期
4. `node seo-aeo-kit/scripts/validate-seo.mjs index.html` が全て PASS することを確認
5. 変更点と理由を1行ずつ commit メッセージに書いて commit & push
6. 変更しない判断をした日は、その理由を data/insights の末尾に追記して commit（無理に変えない）
```

### 登録方法（Claude Code on the web の場合）
セッションで「毎朝7時に上記プロンプトで Routine を作って」と依頼する（cron: `0 7 * * *`）。
ローカルCLIなら cron + `claude -p "$(cat prompt.txt)"` でも同じことができる。

## 改善の判断基準（analyze.py が出す候補の読み方）

| シグナル | 意味 | 打ち手 |
|---|---|---|
| 順位11〜20位 × 表示多い | 「あと一歩」ページ/クエリ | そのクエリの語を title・h2・FAQ に自然に組み込む |
| 順位1〜10位 × CTR が目安以下 | 見せ方で損している | title/description をクエリ意図に合わせ書き直す |
| 表示急増クエリ | 新しい需要 | 対応セクション/FAQを追加 |
| GA4: 流入増×CV率低下 | 導線のミスマッチ | CTA文言・位置、ファーストビューを見直す |
| GA4: 平均エンゲージメント時間の急落 | 期待外れ着地 | descriptionと本文冒頭の約束を一致させる |

## 安全弁（自動改善の暴走防止）

1. **1日の変更は最大2件**。一度に多く変えると何が効いたか分からなくなる。
2. **事実（価格・住所・実績）は自動変更禁止**。表現・構成・メタ情報のみ。
3. **変更ログは commit 履歴がそのまま台帳**。週1で `git log --oneline --since='1 week ago'` と数値推移を突き合わせる。
4. 順位が大きく下がった変更は revert を検討（`git revert <hash>`）。
5. GSCデータは2〜3日遅れる。**変更の効果判定は最低7日待つ**（毎日変更はするが、同じ箇所は7日以内に再変更しない）。

## 週次レビュー（人間・5分）

- [ ] `data/insights_*.md` の直近7日分をながめ、方向性が合っているか
- [ ] クリック数・CV（generate_lead）の週次推移
- [ ] 今週の変更コミット一覧と効果
- [ ] AEO: 月1で aeo-checklist.md の「検証」節（AIに聞いて引用確認）
