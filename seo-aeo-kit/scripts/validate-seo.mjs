#!/usr/bin/env node
/**
 * LPのSEO/AEO要素を静的検査する。
 * 使い方: node seo-aeo-kit/scripts/validate-seo.mjs <index.htmlのパス>
 * 終了コード: FAILが1つでもあれば1（CI組み込み可）。WARNは通す。
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const file = process.argv[2] ?? "index.html";
if (!existsSync(file)) {
  console.error(`ERROR: ファイルが見つかりません: ${file}`);
  process.exit(1);
}
const html = readFileSync(file, "utf-8");
const root = dirname(file);

const results = [];
const pass = (name, note = "") => results.push({ level: "PASS", name, note });
const warn = (name, note = "") => results.push({ level: "WARN", name, note });
const fail = (name, note = "") => results.push({ level: "FAIL", name, note });

const pick = (re) => html.match(re)?.[1]?.trim();

// ── 基本SEO ──────────────────────────────────────────────
const title = pick(/<title>([^<]*)<\/title>/i);
if (!title) fail("title", "titleタグがない");
else if (title.length < 15 || title.length > 45) warn("title", `${title.length}文字（目安15〜45）: ${title}`);
else pass("title", `${title.length}文字`);

const desc = pick(/<meta\s+name="description"\s+content="([^"]*)"/i);
if (!desc) fail("meta description", "descriptionがない");
else if (desc.length < 60 || desc.length > 140) warn("meta description", `${desc.length}文字（目安60〜140）`);
else pass("meta description", `${desc.length}文字`);

if (/<link\s+rel="canonical"\s+href="https?:\/\/[^"]+"/i.test(html)) pass("canonical");
else fail("canonical", "canonicalがないか相対URL");

if (/<html[^>]*\blang="ja"/i.test(html)) pass("html lang=ja");
else fail("html lang", 'lang="ja" がない');

const h1s = html.match(/<h1[\s>]/gi)?.length ?? 0;
if (h1s === 1) pass("h1が1つ");
else fail("h1", `h1が${h1s}個（1個であるべき）`);

const imgsNoAlt = (html.match(/<img(?![^>]*\balt=)[^>]*>/gi) ?? []).length;
if (imgsNoAlt === 0) pass("img alt");
else warn("img alt", `alt無しのimgが${imgsNoAlt}個`);

// ── 計測（PDCAの土台）──────────────────────────────────
const ga4Id = pick(/googletagmanager\.com\/gtag\/js\?id=(G-[A-Z0-9]+|\{\{[^}]+\}\})/);
if (!ga4Id) fail("GA4タグ", "gtag.js が未設置（PDCAの計測土台。必須）");
else if (ga4Id.includes("{{") || ga4Id === "G-XXXXXXXXXX") warn("GA4タグ", `プレースホルダのまま: ${ga4Id}（公開前に実IDへ差し替え）`);
else pass("GA4タグ", ga4Id);

if (/gtag\('event',\s*'generate_lead'/.test(html)) pass("CVイベント(generate_lead)");
else warn("CVイベント", "generate_lead イベント送信が見つからない（CV計測なしではPDCAが回らない）");

const gsc = pick(/<meta\s+name="google-site-verification"\s+content="([^"]*)"/i);
if (!gsc) warn("GSC認証メタ", "無し（DNS認証を使う場合はOK。どちらも無ければSearch Console登録不可）");
else if (gsc.includes("{{") || /^X{5,}/.test(gsc) || /PLACEHOLDER/i.test(gsc)) warn("GSC認証メタ", "プレースホルダのまま（公開前に実コードへ差し替え）");
else pass("GSC認証メタ");

// ── OGP ─────────────────────────────────────────────────
for (const p of ["og:title", "og:description", "og:image", "og:url"]) {
  if (new RegExp(`<meta\\s+property="${p}"\\s+content="[^"]+"`, "i").test(html)) pass(p);
  else fail(p, "無し");
}
if (/<meta\s+name="twitter:card"/i.test(html)) pass("twitter:card");
else warn("twitter:card", "無し");

// ── 構造化データ（AEOの核）──────────────────────────────
const ldBlocks = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
if (ldBlocks.length === 0) {
  fail("JSON-LD", "構造化データが無い");
} else {
  const types = new Set();
  let parseError = false;
  let dateModified = null;
  let faqCount = 0;
  let speakable = false;
  for (const [, raw] of ldBlocks) {
    try {
      const data = JSON.parse(raw);
      const nodes = data["@graph"] ?? [data];
      for (const node of nodes) {
        for (const t of [node["@type"]].flat()) types.add(t);
        if (node["@type"] === "WebPage") {
          dateModified = node.dateModified ?? dateModified;
          if (node.speakable) speakable = true;
        }
        if (node["@type"] === "FAQPage") faqCount = (node.mainEntity ?? []).length;
      }
    } catch (e) {
      parseError = true;
      fail("JSON-LDパース", e.message.slice(0, 80));
    }
  }
  if (!parseError) pass("JSON-LDパース", `${ldBlocks.length}ブロック`);
  for (const t of ["Organization", "WebSite", "WebPage", "FAQPage"]) {
    if (types.has(t)) pass(`JSON-LD: ${t}`);
    else (t === "WebSite" ? warn : fail)(`JSON-LD: ${t}`, "無し");
  }
  if (faqCount >= 8) pass("FAQ数", `${faqCount}問`);
  else if (faqCount > 0) warn("FAQ数", `${faqCount}問（AEO推奨は8問以上）`);
  if (speakable) pass("speakable");
  else warn("speakable", "無し（音声/AI要約向けに h1・リード文の指定を推奨）");
  if (dateModified) {
    pass("dateModified", dateModified);
    // sitemap.xml の lastmod と一致しているか（正直な申告の整合性）
    const sitemapPath = join(root, "sitemap.xml");
    if (existsSync(sitemapPath)) {
      const lastmod = readFileSync(sitemapPath, "utf-8").match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
      if (lastmod === dateModified) pass("dateModified⇔sitemap lastmod 一致");
      else fail("dateModified⇔sitemap lastmod", `不一致: WebPage=${dateModified} / sitemap=${lastmod}`);
    }
  } else warn("dateModified", "WebPageに無し");
}

// ── AEO必須ファイル ──────────────────────────────────────
for (const f of ["llms.txt", "robots.txt", "sitemap.xml"]) {
  if (existsSync(join(root, f))) pass(f);
  else fail(f, `${root}/ に無し`);
}
if (existsSync(join(root, "robots.txt"))) {
  const robots = readFileSync(join(root, "robots.txt"), "utf-8");
  const bots = ["GPTBot", "ClaudeBot", "PerplexityBot", "OAI-SearchBot", "Claude-SearchBot"];
  const missing = bots.filter((b) => !robots.includes(b));
  if (missing.length === 0) pass("robots.txt AIボット記載");
  else warn("robots.txt", `AIボット記載なし: ${missing.join(", ")}`);
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
