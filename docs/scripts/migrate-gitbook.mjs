#!/usr/bin/env node
/**
 * One-shot migration of the two Seer GitBook spaces into this Mintlify site.
 *
 *   node docs/scripts/migrate-gitbook.mjs
 *
 * GitBook serves raw Markdown at `<url>.md` and lists every page in
 * `sitemap-pages.xml`, so the whole site can be pulled programmatically.
 * Images are the one thing missing from that Markdown: it references
 * `/files/<id>` with ids that do not match the CDN, so they are recovered from
 * the rendered HTML by document order.
 *
 * Developer guides were NOT scraped: they came from `integration-docs/` in the
 * repo, which was newer than what GitBook published. That folder was removed
 * once the guides landed here, so this step is now a no-op and the .mdx files
 * under developers/ are the source of truth.
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DOCS = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const REPO = path.resolve(DOCS, "..");
const CACHE = process.env.GB_CACHE || path.join(DOCS, ".gitbook-cache");

// `rootSlug` is the real page behind the space root: `<base>.md` is a 404 page.
const SPACES = [
  { id: "seer-3", base: "https://seer-3.gitbook.io/seer-documentation", rootSlug: "overview/what-is-seer" },
  { id: "seer-2", base: "https://seer-2.gitbook.io/seer", rootSlug: "introduction-to-seer" },
];

/* ------------------------------------------------------------------ fetching */

async function cached(url, binary = false) {
  const key = url.replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 180);
  const file = path.join(CACHE, key);
  if (existsSync(file)) return binary ? readFile(file) : readFile(file, "utf8");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const data = binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
  await mkdir(CACHE, { recursive: true });
  await writeFile(file, data);
  return data;
}

async function sitemap(base) {
  const xml = await cached(`${base}/sitemap-pages.xml`);
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

/* ------------------------------------------------------- url -> mintlify path */

// Pages we deliberately drop: excluded by request, redundant with the Mintlify
// sidebar, or superseded by integration-docs/.
const SKIP = [
  /^prediction-market-basics(\/|$)/, // excluded by request (seer-2)
  /^app$/, // seer-2: just an embed of seer.pm, folded into index.mdx
  /^developers\/interact-with-seer(\/|$)/, // generated from integration-docs/
];

const RENAME = [
  // seer-3
  ["overview/glossary", "documentation/glossary"],
  ["getting-started/navigate-our-site", "app/navigate-our-site"],
  [/^getting-started\/navigate-our-site\/(.+)$/, "app/$1"],
  ["developers/intro", "developers/introduction"],
  ["developers/diagrams", "developers/diagrams/overview"],
  ["developers/subgraph", "developers/subgraph/overview"],
  ["developers/contracts", "developers/contracts/overview"],
  ["developers/contracts/core", "developers/contracts/core/overview"],
  ["developers/contracts/token", "developers/contracts/token/overview"],
  ["developers/contracts/interaction", "developers/contracts/interaction/overview"],
  ["developers/contracts/futarchy-test", "developers/contracts/futarchy/overview"],
  [/^developers\/contracts\/futarchy-test\/(.+)$/, "developers/contracts/futarchy/$1"],
  ["developers/subgraph/graphql-query", "developers/subgraph/graphql-query/overview"],
  ["other/audit-reports", "resources/audit-reports"],
  // seer-2 -> whitepaper tab
  ["why-did-previous-prediction-markets-fail", "whitepaper/why-prediction-markets-failed"],
  [/^why-did-previous-prediction-markets-fail\/(.+)$/, "whitepaper/why-prediction-markets-failed/$1"],
  ["reference", "whitepaper/references"],
  [/^(seer-solution|applications|conclusion)(\/.*)?$/, "whitepaper/$1$2"],
];

function toDocPath(spaceId, url) {
  const base = SPACES.find((s) => s.id === spaceId).base;
  const slug = url.replace(base, "").replace(/^\/|\/$/g, "");

  // Space landing pages.
  if (slug === "") return spaceId === "seer-3" ? "documentation/what-is-seer" : "index";
  if (SKIP.some((re) => re.test(slug))) return null;

  let out = slug;
  for (const [from, to] of RENAME) {
    if (typeof from === "string") {
      if (slug === from) {
        out = to;
        break;
      }
    } else if (from.test(slug)) {
      out = slug.replace(from, to).replace(/\/+$/, "");
      break;
    }
  }
  // `+` breaks routing (seer-solution/practical-implementation-amm-+-auctions).
  return out.replace(/-\+-/g, "-and-");
}

/* ---------------------------------------------------------------- transforms */

const HINTS = { info: "Info", note: "Note", tip: "Tip", success: "Check", warning: "Warning", danger: "Danger" };

function gitbookToMdx(md) {
  let out = md;

  // Callouts. Each {% endhint %} closes with the tag that opened it.
  out = out.replace(/\{%\s*hint\s+style="(\w+)"\s*%\}/g, (_, s) => `<${HINTS[s] || "Info"}>`);
  out = out.replace(/\{%\s*endhint\s*%\}/g, "<!--ENDHINT-->");
  const stack = [];
  out = out.replace(/<(Info|Note|Tip|Check|Warning|Danger)>|<!--ENDHINT-->/g, (m, tag) => {
    if (tag) {
      stack.push(tag);
      return m;
    }
    return `</${stack.pop() || "Info"}>`;
  });

  // Embeds and content refs become cards.
  out = out.replace(
    /\{%\s*embed\s+url="([^"]+)"\s*%\}[ \t]*\n?([^\n]*)\n?\s*\{%\s*endembed\s*%\}/g,
    (_, url, label) => card(url, label),
  );
  out = out.replace(/\{%\s*embed\s+url="([^"]+)"\s*%\}/g, (_, url) => card(url, ""));
  out = out.replace(
    /\{%\s*content-ref\s+url="([^"]+)"\s*%\}[\s\S]*?\{%\s*endcontent-ref\s*%\}/g,
    (_, url) => card(url, ""),
  );

  // Tabs.
  out = out.replace(/\{%\s*tabs\s*%\}/g, "<Tabs>").replace(/\{%\s*endtabs\s*%\}/g, "</Tabs>");
  out = out.replace(/\{%\s*tab\s+title="([^"]*)"\s*%\}/g, (_, t) => `<Tab title="${t}">`);
  out = out.replace(/\{%\s*endtab\s*%\}/g, "</Tab>");

  // Code block titles, then drop any remaining GitBook block.
  out = out.replace(/\{%\s*code[^%]*title="([^"]*)"[^%]*%\}\n```(\w*)/g, (_, t, lang) => `\`\`\`${lang || "text"} ${t}`);
  out = out.replace(/\{%\s*endcode\s*%\}\n?/g, "");
  out = out.replace(/\{%[^%]*%\}\n?/g, "");

  // GitBook inline highlight -> plain text.
  out = out.replace(/<mark[^>]*>([\s\S]*?)<\/mark>/g, "$1");

  // Heading anchors.
  out = out.replace(/\s*<a href="#[^"]*"\s+id="[^"]*"><\/a>/g, "");

  // Layout wrappers around figures.
  out = out.replace(/<div\s+align="[^"]*">([\s\S]*?)<\/div>/g, "$1");

  // Figures -> <Frame>.
  out = out.replace(
    /<figure>\s*<img src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>\s*<figcaption>([\s\S]*?)<\/figcaption>\s*<\/figure>/g,
    (_, src, alt, cap) => {
      // Captions are often just `<p><br></p>`: strip markup before deciding.
      const caption = cap.replace(/<[^>]*>/g, "").trim();
      const img = `<img src="${src}" alt="${alt}" />`;
      // Kept on one line so figures nested in list items stay inside the item.
      return caption ? `<Frame caption="${quote(caption)}">${img}</Frame>` : `<Frame>${img}</Frame>`;
    },
  );

  // MDX has no GFM autolinks: `<https://x>` parses as a JSX tag and fails.
  out = out.replace(/<(https?:\/\/[^>\s]+)>/g, (_, url) => `[${url}](${url})`);

  // Entities GitBook emits for trailing spaces, and tags MDX needs closed.
  out = out.replace(/&#x20;|&#20;/g, " ");
  out = out.replace(/<br\s*\/?>/g, "\n");
  out = out.replace(/<hr\s*\/?>/g, "---");

  return out;
}

const quote = (s) => s.replace(/\\/g, "").replace(/"/g, "'").replace(/\s+/g, " ").trim();

function card(url, label) {
  const href = url.replace(/^<|>$/g, "").trim();
  const title = quote(label || href).replace(/^<|>$/g, "");
  return `<Card title="${title}" href="${href}" />`;
}

/**
 * MDX parses `{` as an expression and `<` as JSX. Escape the ones that appear
 * in prose or tables, leaving code fences, inline code and our own components
 * alone.
 */
const KNOWN_TAGS =
  /^<\/?(Info|Note|Tip|Check|Warning|Danger|Card|CardGroup|Tabs|Tab|Frame|Steps|Step|Accordion|AccordionGroup|Columns|img|table|thead|tbody|tr|th|td|strong|em|ul|ol|li)(\s|\/|>|$)/i;

function escapeMdx(body) {
  let inFence = false;
  return body
    .split("\n")
    .map((line) => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;

      // Mask inline code spans so we do not escape inside them.
      const spans = [];
      let masked = line.replace(/`[^`]*`/g, (m) => `@@CODE${spans.push(m) - 1}@@`);

      // `{` starts an expression and a `$...$` pair is parsed as LaTeX math.
      masked = masked.replace(/[{}$]/g, (c) => `\\${c}`);
      masked = masked.replace(/<[^<>]*>|</g, (m) => {
        if (KNOWN_TAGS.test(m)) return m;
        return m.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      });

      return masked.replace(/@@CODE(\d+)@@/g, (_, i) => spans[Number(i)]);
    })
    .join("\n");
}

/* -------------------------------------------------------------------- images */

async function pageImages(url) {
  const html = await cached(url);
  const urls = [];
  const seen = new Set();
  for (const m of html.matchAll(/~gitbook\/image\?url=([^"&]+)/g)) {
    const decoded = decodeURIComponent(m[1]).replace(/&amp;/g, "&");
    if (seen.has(decoded)) continue;
    seen.add(decoded);
    urls.push(decoded);
  }
  return urls;
}

async function localizeImages(md, pageUrl, docPath) {
  const refs = [...md.matchAll(/\/files\/[A-Za-z0-9_-]+/g)].map((m) => m[0]);
  if (refs.length === 0) return md;

  const remote = await pageImages(pageUrl);
  const dir = path.posix.join("/images", docPath);
  await mkdir(path.join(DOCS, dir), { recursive: true });

  const unique = [...new Set(refs)];
  const map = new Map();
  for (let i = 0; i < unique.length; i++) {
    const src = remote[i];
    if (!src) {
      console.warn(`  ! missing image ${i + 1}/${unique.length} on ${docPath}`);
      continue;
    }
    const raw = decodeURIComponent(src.split("?")[0]).split("/").pop();
    const name = `${String(i + 1).padStart(2, "0")}-${raw.replace(/[^A-Za-z0-9._-]/g, "-")}`;
    await writeFile(path.join(DOCS, dir, name), await cached(src, true));
    map.set(unique[i], path.posix.join(dir, name));
  }
  return md.replace(/\/files\/[A-Za-z0-9_-]+/g, (r) => map.get(r) || r);
}

/* --------------------------------------------------------------------- pages */

const stripBanner = (md) => md.replace(/^>\s*For the complete documentation index[\s\S]*?\n\n/, "");

function splitTitle(md) {
  const m = md.match(/^#\s+(.+)$/m);
  if (!m) return { title: "Untitled", body: md };
  const title = m[1]
    .replace(/^[^\p{L}\p{N}]+/u, "") // leading emoji / decoration
    .replace(/\s*<a href[^>]*><\/a>/g, "")
    .trim();
  return { title, body: md.slice(0, m.index) + md.slice(m.index + m[0].length) };
}

/** Section landings worth keeping even though they are only a list of links. */
const KEEP_INDEX = new Set(["whitepaper/seer-solution"]);

/** Turn `- [Title](url): description` bullets into Mintlify cards. */
function linkIndexToCards(body) {
  const cards = [...body.matchAll(/^[-*][ \t]*\[([^\]]+)\]\(([^)]+)\)[ \t]*:?[ \t]*(.*)$/gm)].map(
    ([, title, href, desc]) =>
      desc.trim()
        ? `  <Card title="${quote(title)}" href="${href}">\n    ${desc.trim()}\n  </Card>`
        : `  <Card title="${quote(title)}" href="${href}" />`,
  );
  return `<CardGroup cols={2}>\n${cards.join("\n")}\n</CardGroup>`;
}

/** A page whose body is nothing but a list of links is replaced by the sidebar. */
function isLinkIndex(body) {
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.length > 0 && lines.every((l) => /^[-*]\s*\[.+\]\(.+\)/.test(l));
}

function frontmatter(title) {
  const esc = (s) => `"${s.replace(/\\/g, "").replace(/"/g, '\\"')}"`;
  return `---\ntitle: ${esc(title)}\n---\n`;
}

/* ---------------------------------------------------------------------- main */

const linkMap = new Map(); // gitbook url -> mintlify route
const titles = new Map(); // gitbook url -> page title, for autolink labels

/**
 * Section landings whose GitBook page is only a paragraph of intro. On GitBook
 * the sub-pages were visible underneath it; here the sidebar nests them via the
 * group's `root`, and the page itself gets a card for each one so it stands on
 * its own.
 */
const SECTION_LANDINGS = new Set(["whitepaper/why-prediction-markets-failed", "whitepaper/applications"]);

/** Cards for the direct children of `docPath`, in navigation order. */
function childCards(docPath) {
  const cards = [];
  for (const [url, route] of linkMap) {
    const child = route.startsWith(`/${docPath}/`) ? route.slice(docPath.length + 2) : null;
    if (!child || child.includes("/")) continue;
    cards.push(`  <Card title="${quote(titles.get(url) || child)}" href="${route}" />`);
  }
  return cards.length ? `\n\n<CardGroup cols={2}>\n${cards.join("\n")}\n</CardGroup>` : "";
}
const skipped = [];

/**
 * The whitepaper intro is the site landing page. Its GitBook opening pointed
 * readers to the seer-3 space, which this site now contains, so it is replaced
 * with an orientation note and links into the other two tabs.
 */
function rewriteLanding(body) {
  // Link rewriting has already run, so the seer-3 pointer is an internal route.
  const intro = body.match(/^\*\*Mainnet live on\*\*[\s\S]*?\(\/documentation\/what-is-seer\)\s*/m);
  if (!intro) console.warn("  ! landing intro not found, left as-is");
  return `${
    intro
      ? body.replace(
          intro[0],
          `<Note>\n  This section is an extract of the Seer whitepaper: the reasoning behind the\n  protocol. For how to use the app, see [What is Seer](/documentation/what-is-seer);\n  for how to build on it, see the [Developers](/developers/introduction) tab.\n</Note>\n\nSeer is live on mainnet at [seer.pm](https://seer.pm/).\n\n`,
        )
      : body
  }

<CardGroup cols={2}>
  <Card title="Use the app" icon="compass" href="/documentation/what-is-seer">
    Deposit collateral, create markets, trade outcome tokens and provide liquidity.
  </Card>
  <Card title="Build on Seer" icon="code" href="/developers/introduction">
    Contracts, subgraph and the HTTP API, with viem examples for every flow.
  </Card>
</CardGroup>`;
}

async function buildLinkMap() {
  for (const space of SPACES) {
    for (const url of await sitemap(space.base)) {
      const docPath = toDocPath(space.id, url);
      if (!docPath) continue;
      const clean = url.replace(/\/$/, "");
      linkMap.set(clean, docPath === "index" ? "/" : `/${docPath}`);
      const source = clean === space.base ? `${space.base}/${space.rootSlug}` : clean;
      titles.set(clean, splitTitle(stripBanner(await cached(`${source}.md`))).title);
    }
  }
  const [b3, b2] = SPACES.map((s) => s.base);

  // Excluded seer-2 pages that surviving text still links to.
  linkMap.set(b2, "/");
  linkMap.set(`${b2}/prediction-market-basics`, "/app/navigate-our-site");
  linkMap.set(`${b2}/prediction-market-basics/creating-tokens`, "/app/mint-merge-redeem-outcome-tokens");
  linkMap.set(`${b2}/prediction-market-basics/redeeming-tokens`, "/app/mint-merge-redeem-outcome-tokens");
  linkMap.set(`${b2}/prediction-market-basics/trading-tokens`, "/app/buy-sell-outcome-tokens");
  linkMap.set(`${b2}/prediction-market-basics/scalar-markets`, "/documentation/glossary");
  linkMap.set(`${b2}/app`, "https://seer.pm");

  // Developer guides live in the repo, not on GitBook.
  linkMap.set(b3, "/documentation/what-is-seer");
  linkMap.set(`${b3}/developers/interact-with-seer`, "/developers/configuration");
  for (const [gb, mint] of Object.entries({
    configuration: "/developers/configuration",
    "create-a-market": "/developers/guides/create-a-market",
    "resolve-a-market": "/developers/guides/resolve-a-market",
    "split-merge-and-redeem": "/developers/guides/split-merge-and-redeem",
    "conditional-market": "/developers/guides/conditional-markets",
    "futarchy-market": "/developers/guides/futarchy-markets",
    trading: "/developers/guides/trading",
    api: "/developers/api",
  })) {
    linkMap.set(`${b3}/developers/interact-with-seer/${gb}`, mint);
  }
}

const SPACE_PREFIXES = SPACES.map((s) => [new URL(s.base).pathname, s.base]);

function rewriteLinks(md, unresolved) {
  // GitBook also emits space-root-relative links: `/seer-documentation/a/b.md`.
  for (const [prefix, base] of SPACE_PREFIXES) {
    md = md.replaceAll(`(${prefix}/`, `(${base}/`);
  }
  // Autolinks (`<url>`) cannot wrap an internal route: turn them into links.
  md = md.replace(/<(https:\/\/seer-[23]\.gitbook\.io[^>\s]*)>/g, (raw, url) => {
    const base = url.replace(/\.md$/, "").replace(/\/$/, "").split("#")[0];
    return linkMap.has(base) ? `[${titles.get(base) || "Seer documentation"}](${base})` : raw;
  });
  return md.replace(/https:\/\/seer-[23]\.gitbook\.io\/[^\s)>"'*\]]+/g, (raw) => {
    const clean = raw.replace(/\.md(?=$|#)/, "").replace(/\/$/, "");
    const [base, hash] = clean.split("#");
    const target = linkMap.get(base);
    if (!target) {
      unresolved.add(base);
      return raw;
    }
    return hash ? `${target}#${hash}` : target;
  });
}

async function migrateSpace(space) {
  const urls = await sitemap(space.base);
  const unresolved = new Set();
  let written = 0;

  for (const url of urls) {
    const docPath = toDocPath(space.id, url);
    if (!docPath) {
      skipped.push([url, "excluded"]);
      continue;
    }

    const source = url.replace(/\/$/, "") === space.base ? `${space.base}/${space.rootSlug}` : url.replace(/\/$/, "");
    const md = stripBanner(await cached(`${source}.md`));
    const { title, body: afterTitle } = splitTitle(md);

    const index = isLinkIndex(afterTitle);
    if (index && !KEEP_INDEX.has(docPath)) {
      skipped.push([url, "link index"]);
      continue;
    }

    let body = await localizeImages(afterTitle, url, docPath);
    body = rewriteLinks(body, unresolved);
    body = index ? linkIndexToCards(body) : gitbookToMdx(body);
    if (!index) body = escapeMdx(body);
    body = body.replace(/\n{3,}/g, "\n\n").trim();

    if (docPath === "index") body = rewriteLanding(body);
    if (SECTION_LANDINGS.has(docPath)) body += childCards(docPath);

    const file = path.join(DOCS, `${docPath}.mdx`);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, `${frontmatter(title)}${body}\n`);
    written++;
  }

  console.log(`${space.id}: ${written} pages written, ${urls.length - written} skipped`);
  if (unresolved.size) console.warn(`  unresolved links:\n    ${[...unresolved].join("\n    ")}`);
}

/* ------------------------------------- developer guides from integration-docs */

const GUIDES = {
  "1-viem-setup.md": ["developers/configuration", "Configuration"],
  "2-create-market.md": ["developers/guides/create-a-market", null],
  "3-resolve-market.md": ["developers/guides/resolve-a-market", null],
  "4-split-merge-and-redeem.md": ["developers/guides/split-merge-and-redeem", null],
  "5-conditional-market.md": ["developers/guides/conditional-markets", null],
  "6-futarchy-markets.md": ["developers/guides/futarchy-markets", null],
  "7-trading.md": ["developers/guides/trading", null],
  "8-api.md": ["developers/api", null],
  "9-collateral-profiles.md": ["developers/guides/collateral-profiles", null],
};

async function migrateGuides() {
  const src = path.join(REPO, "integration-docs");
  if (!existsSync(src)) {
    // The folder is gone, so a re-run leaves developers/{configuration,api}.mdx
    // and developers/guides/*.mdx untouched: edit those files directly.
    console.log("integration-docs: gone, developer guides are maintained in docs/ directly");
    return;
  }
  for (const [file, [docPath, override]] of Object.entries(GUIDES)) {
    const md = await readFile(path.join(src, file), "utf8");
    const { title, body: afterTitle } = splitTitle(md);

    let body = afterTitle;
    for (const [f, [target]] of Object.entries(GUIDES)) {
      body = body.replace(new RegExp(`\\((?:\\./)?${f}(#[^)]*)?\\)`, "g"), (_, hash) => `(/${target}${hash || ""})`);
    }
    body = body.replace(/\(0-intro\.md\)/g, "(/developers/introduction)");
    body = gitbookToMdx(body);
    // `**Note:** ...` paragraphs read better as callouts.
    body = body.replace(/^\*\*Note:\*\*\s*(.+)$/gm, (_, t) => `<Note>\n${t.trim()}\n</Note>`);
    body = escapeMdx(body).replace(/\n{3,}/g, "\n\n").trim();

    const out = path.join(DOCS, `${docPath}.mdx`);
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, `${frontmatter(override || title)}${body}\n`);
  }
  console.log(`integration-docs: ${Object.keys(GUIDES).length} guides written`);
}

await buildLinkMap();
for (const space of SPACES) await migrateSpace(space);
await migrateGuides();
await writeFile(
  path.join(DOCS, "scripts/link-map.json"),
  `${JSON.stringify(Object.fromEntries([...linkMap].sort()), null, 2)}\n`,
);
console.log(`\nskipped pages:\n${skipped.map(([u, why]) => `  ${why.padEnd(11)} ${u}`).join("\n")}`);
