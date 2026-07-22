<!--
  ============================================================
  AIEO記事テンプレート（seo-aeo-kit/content-pipeline）
  使い方: {{...}} を実際の値に置換して1記事分のHTMLを作る。
  検査: node seo-aeo-kit/content-pipeline/validate-article.mjs <記事のパス>
  参考: 記事の<head>は seo-aeo-kit/templates/head-seo-aeo.html を流用し、
        JSON-LD @graph に Organization / WebSite に加えて下記の Article + FAQPage を足す。
  ============================================================
-->

# 執筆ルール（AI引用されやすさ優先）

1. **見出しは質問形**: `## AI研修の費用相場は？` のように、ユーザーがAIに聞く言い回しそのものを見出しにする。
2. **冒頭1〜2文で即答**: 見出し直後は結論から。前置き・世間話を挟まない。LLMは記事冒頭〜30%を優先的に引用する傾向があるため、結論を後回しにしない。
3. **根拠は箇条書き**: 数字・出典を短い箇条書きで並べる。長い説明文よりAIが拾いやすい。
4. **1見出し1トピック**: 質問と答えが1対1になるように分割する（複数の論点を1見出しに詰め込まない）。
5. **事実のみ**: 誇張・未確定情報は書かない（llms.txtの確定事実と矛盾しないこと）。
6. **「引用される」で終わらせない**: 各セクションの終わりに、次のアクション（無料相談・関連記事へのリンク等）を必ず置く。技術的に深いだけの記事は引用されても問い合わせに繋がらない。

---

# {{記事タイトル。32文字前後。ターゲットキーワードを含める}}

<!-- meta description: 80〜120文字。この記事で何が分かるかを具体的に -->
<!-- target_keyword: {{keyword-discovery.py の出力から選んだキーワード}} -->

## リード文（結論ファースト、2〜3文）

{{この記事を読むと何が分かるか。数字を含めて具体的に。}}

## {{質問形見出し1。例: AI研修の費用相場は？}}

{{結論を1〜2文で即答}}

- {{根拠1（数字・出典つき）}}
- {{根拠2}}
- {{根拠3}}

→ {{次のアクション。例: 自社の場合の見積もりは無料相談で確認できます}}

## {{質問形見出し2}}

{{結論を1〜2文で即答}}

- {{根拠1}}
- {{根拠2}}

## {{質問形見出し3〜N（記事内で3〜8問が目安。多すぎる場合は記事を分割する）}}

{{同様の構成で追加}}

---

## この記事のFAQ（本文にも同じ内容を表示し、下のJSON-LDと一致させる）

**Q. {{FAQ_Q1}}**
A. {{FAQ_A1（結論→根拠の順で1〜3文）}}

**Q. {{FAQ_Q2}}**
A. {{FAQ_A2}}

**Q. {{FAQ_Q3（記事1本につき最低3問）}}**
A. {{FAQ_A3}}

---

## 埋め込むJSON-LD（<head>のJSON-LDに同じ@graphの中で追加。既存のOrganization/WebSiteの@idを再利用する）

```json
{
  "@type": "Article",
  "@id": "{{URL}}#article",
  "headline": "{{記事タイトル}}",
  "description": "{{meta description}}",
  "author": { "@id": "{{SITE_URL}}#org" },
  "publisher": { "@id": "{{SITE_URL}}#org" },
  "datePublished": "{{YYYY-MM-DD}}",
  "dateModified": "{{YYYY-MM-DD}}",
  "mainEntityOfPage": "{{URL}}",
  "inLanguage": "ja"
}
```

```json
{
  "@type": "FAQPage",
  "@id": "{{URL}}#faq",
  "isPartOf": { "@id": "{{URL}}#article" },
  "mainEntity": [
    {
      "@type": "Question",
      "name": "{{FAQ_Q1}}",
      "acceptedAnswer": { "@type": "Answer", "text": "{{FAQ_A1}}" }
    },
    {
      "@type": "Question",
      "name": "{{FAQ_Q2}}",
      "acceptedAnswer": { "@type": "Answer", "text": "{{FAQ_A2}}" }
    },
    {
      "@type": "Question",
      "name": "{{FAQ_Q3}}",
      "acceptedAnswer": { "@type": "Answer", "text": "{{FAQ_A3}}" }
    }
  ]
}
```

## 公開前チェック（checklists/aeo-checklist.md の「D. コンテンツの書き方」と共通）

- [ ] 各見出しが質問形になっている
- [ ] 各見出し直後の1〜2文で結論を言っている（前置きなし）
- [ ] FAQが本文とJSON-LDで一致している（3問以上）
- [ ] 価格・期間・実績など数字は具体的（「安い」ではなく「20万円〜」）
- [ ] llms.txtの確定事実と矛盾していない
- [ ] `node seo-aeo-kit/content-pipeline/validate-article.mjs <path>` がFAIL 0件
- [ ] `node seo-aeo-kit/scripts/validate-seo.mjs <path>` がFAIL 0件（head部分の共通チェック）
