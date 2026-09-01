#!/usr/bin/env node
/**
 * Cross-checks docs.json against the files on disk: every navigation entry must
 * resolve to an .mdx file, and every .mdx file must appear in the navigation.
 *
 *   node docs/scripts/check-nav.mjs
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DOCS = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

/**
 * Page slugs only: strings inside `pages` arrays plus a group's `root` landing
 * page, never group or tab names.
 */
function collect(node, out = [], inPages = false) {
  if (typeof node === "string") {
    if (inPages) out.push(node);
  } else if (Array.isArray(node)) {
    for (const n of node) collect(n, out, inPages);
  } else if (node && typeof node === "object") {
    if (typeof node.root === "string") out.push(node.root);
    for (const [key, value] of Object.entries(node)) {
      if (key !== "root") collect(value, out, key === "pages");
    }
  }
  return out;
}

async function mdxFiles(dir = DOCS, prefix = "") {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "scripts") continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...(await mdxFiles(path.join(dir, entry.name), rel)));
    else if (entry.name.endsWith(".mdx")) out.push(rel.replace(/\.mdx$/, ""));
  }
  return out;
}

const config = JSON.parse(await readFile(path.join(DOCS, "docs.json"), "utf8"));
const nav = new Set(collect(config.navigation));
const files = new Set(await mdxFiles());

const missing = [...nav].filter((p) => !files.has(p)).sort();
const orphans = [...files].filter((p) => !nav.has(p)).sort();

console.log(`${files.size} pages on disk, ${nav.size} in navigation`);
if (missing.length) console.error(`\nin docs.json but no file:\n  ${missing.join("\n  ")}`);
if (orphans.length) console.error(`\non disk but not in docs.json:\n  ${orphans.join("\n  ")}`);

// Every local image reference must resolve.
const broken = [];
for (const page of files) {
  const body = await readFile(path.join(DOCS, `${page}.mdx`), "utf8");
  for (const m of body.matchAll(/src="(\/images\/[^"]+)"/g)) {
    const file = path.join(DOCS, m[1]);
    try {
      await readFile(file);
    } catch {
      broken.push(`${page}.mdx -> ${m[1]}`);
    }
  }
}
if (broken.length) console.error(`\nbroken image references:\n  ${broken.join("\n  ")}`);

if (missing.length || orphans.length || broken.length) process.exit(1);
console.log("navigation and images OK");
