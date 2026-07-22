#!/usr/bin/env node
/**
 * 記事(HTML)がAIEO向けの書き方になっているかを静的検査する。
 * <head>の基本SEO/OGP/Organization等は seo-aeo-kit/scripts/validate-seo.mjs で検査済み前提。
 * このスクリプトは「引用されやすい記事の書き方」に特化した追加チェックを行う。
 *
 * 使い方: node seo-aeo-kit/content-pipeline/validate-article.mjs <記事htmlのパス>
 * 終了コード: FAILが1つでもあれば1（CI組み込み可）。WARNは通す。
 */
import { readFileSync, existsSync } from "node:fs";

const file = process.argv[2];
if (!file || !existsSync(file)) {
  console.error("使い方: node validate-article.mjs <記事htmlのパス>");
  process.exit(1);
}
const html = readFileSync(file, "utf-8");

const results = [];
const pass = (name, note = "") => results.push({ level: "PASS", name, note });
const warn = (name, note = "") => results.push({ level: "WARN", name, note });
const fail = (name, note = "") => results.push({ level: "FAIL", name, note });

const stripTags = (s) => s.replace(/<[^>]+>/g, "").trim();
const QUESTION_HINTS = /[？?]|とは|いくら|何|なぜ|どう|できる|違い/;

// ── h1 ──────────────────────────────────────────────────
const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
if (h1s.length === 1) pass("h1が1つ", stripTags(h1s[0][1]));
else fail("h1", `h1が${h1s.length}個（1個であるべき）`);

// ── リード文（h1直後〜最初のh2までの最初の段落）────────────
if (h1s.length >= 1) {
  const afterH1 = html.slice(html.indexOf(h1s[0][0]) + h1s[0][0].length);
  const firstP = afterH1.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!firstP) {
    warn("リード文", "h1直後に<p>が見つからない（結論ファーストの導入文があるか確認）");
  } else {
    const text = stripTags(firstP[1]);
    if (text.length === 0) warn("リード文", "空");
    else if (text.length > 200) warn("リード文", `${text.length}文字（結論を先に、簡潔に。目安200文字以内）`);
    else pass("リード文", `${text.length}文字`);
  }
}

// ── 見出し(h2)の質問形チェック ────────────────────────────
const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => stripTags(m[1]));
if (h2s.length === 0) {
  warn("h2見出し", "見出しが無い（質問形の見出しでAIに拾われやすくする）");
} else {
  const questionLike = h2s.filter((h) => QUESTION_HINTS.test(h));
  const ratio = questionLike.length / h2s.length;
  if (ratio >= 0.5) pass("質問形h2の比率", `${questionLike.length}/${h2s.length}`);
  else warn("質問形h2の比率", `${questionLike.length}/${h2s.length}（半数未満。「〜とは？」「いくら？」等に寄せると引用されやすい）`);
  if (h2s.length > 8) warn("h2の数", `${h2s.length}個（多すぎる場合は記事を分割し、1見出し1トピックを保つ）`);
}

// ── 構造化データ: Article/BlogPosting + FAQPage ───────────
const ldBlocks = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
if (ldBlocks.length === 0) {
  fail("JSON-LD", "構造化データが無い");
} else {
  const types = new Set();
  let parseError = false;
  let faqCount = 0;
  let articleNode = null;
  for (const [, raw] of ldBlocks) {
    try {
      const data = JSON.parse(raw);
      const nodes = data["@graph"] ?? [data];
      for (const node of nodes) {
        for (const t of [node["@type"]].flat()) types.add(t);
        if (node["@type"] === "Article" || node["@type"] === "BlogPosting") articleNode = node;
        if (node["@type"] === "FAQPage") faqCount = (node.mainEntity ?? []).length;
      }
    } catch (e) {
      parseError = true;
      fail("JSON-LDパース", e.message.slice(0, 80));
    }
  }
  if (!parseError) pass("JSON-LDパース", `${ldBlocks.length}ブロック`);

  if (types.has("Article") || types.has("BlogPosting")) pass("JSON-LD: Article/BlogPosting");
  else fail("JSON-LD: Article/BlogPosting", "無し（記事であることを示すノードを追加する）");

  if (articleNode) {
    for (const field of ["headline", "datePublished"]) {
      if (articleNode[field]) pass(`Article.${field}`);
      else fail(`Article.${field}`, "無し");
    }
    if (!articleNode.dateModified) warn("Article.dateModified", "無し（更新時に動かす前提で入れておく）");
  }

  if (types.has("FAQPage")) {
    if (faqCount >= 3) pass("FAQ数", `${faqCount}問`);
    else warn("FAQ数", `${faqCount}問（記事単位は3問以上を目安）`);
  } else {
    fail("JSON-LD: FAQPage", "無し");
  }
}

// ── 結果出力 ─────────────────────────────────────────────
const icon = { PASS: "✅", WARN: "🔶", FAIL: "❌" };
let fails = 0, warns = 0;
for (const r of results) {
  if (r.level === "FAIL") fails++;
  if (r.level === "WARN") warns++;
  console.log(`${icon[r.level]} ${r.level}  ${r.name}${r.note ? ` — ${r.note}` : ""}`);
}
console.log(`\n合計: PASS ${results.length - fails - warns} / WARN ${warns} / FAIL ${fails}`);
process.exit(fails > 0 ? 1 : 0);
