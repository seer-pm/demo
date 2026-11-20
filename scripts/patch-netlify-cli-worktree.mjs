#!/usr/bin/env node
// Patch the cached Netlify CLI so `netlify dev` resolves the repository root inside a git worktree.
//
// The CLI looks for a `.git` *directory* (find-up with `type: 'directory'`). A worktree's `.git` is a
// file, so from `~/orca-projects/demo/<branch>/web` the lookup walks up to the main checkout and
// edge functions (`/subgraph`, `og-image*`) are served from the wrong branch. Upstream issue:
// https://github.com/netlify/cli/issues/7868. The `sed` suggested there (drop the `type` option) is
// not enough: find-up then defaults to files only and the main checkout (a real `.git` directory)
// stops being detected. This patch looks for both and keeps the nearest match.
//
// Usage: node scripts/patch-netlify-cli-worktree.mjs [path/to/node_modules ...]
// With no argument it patches every `netlify` install found in the npx cache (~/.npm/_npx/*).
// Idempotent; re-run after `npx netlify` pulls a new CLI version.
import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const nearestGit = (cwdExpr) =>
  `(await Promise.all([findUp('.git', { ${cwdExpr}, type: 'directory' }), findUp('.git', { ${cwdExpr}, type: 'file' })]))` +
  ".filter(Boolean).sort((a, b) => b.length - a.length)[0] /* patched: netlify/cli#7868 */";

const EDITS = [
  {
    file: "netlify/dist/commands/base-command.js",
    from: "const res = await findUp('.git', { cwd, type: 'directory' });",
    to: `const res = ${nearestGit("cwd")};`,
  },
  {
    file: "netlify/dist/utils/get-repo-data.js",
    from: "findUp('.git', { cwd: workingDir, type: 'directory' }),",
    to: `Promise.resolve().then(async () => ${nearestGit("cwd: workingDir")}),`,
  },
  {
    file: "@netlify/config/lib/options/repository_root.js",
    from: "const repositoryRootA = await findUp('.git', { cwd, type: 'directory' });",
    to: `const repositoryRootA = ${nearestGit("cwd")};`,
  },
];

function findNpxInstalls() {
  const cache = join(homedir(), ".npm", "_npx");
  if (!existsSync(cache)) return [];
  return readdirSync(cache)
    .map((hash) => join(cache, hash, "node_modules"))
    .filter((dir) => existsSync(join(dir, "netlify", "package.json")));
}

const targets = process.argv.length > 2 ? process.argv.slice(2) : findNpxInstalls();
if (targets.length === 0) {
  console.error("No netlify CLI install found. Pass the node_modules directory explicitly.");
  process.exit(1);
}

for (const dir of targets) {
  const version = JSON.parse(readFileSync(join(dir, "netlify", "package.json"), "utf8")).version;
  console.log(`netlify ${version} at ${dir}`);
  for (const { file, from, to } of EDITS) {
    const path = join(dir, file);
    if (!existsSync(path)) {
      console.log(`  skip ${file} (missing)`);
      continue;
    }
    const src = readFileSync(path, "utf8");
    if (src.includes("netlify/cli#7868")) {
      console.log(`  ok   ${file} (already patched)`);
    } else if (src.includes(from)) {
      writeFileSync(path, src.replace(from, to));
      console.log(`  done ${file}`);
    } else {
      console.log(`  FAIL ${file}: expected snippet not found, CLI code changed; patch by hand`);
      process.exitCode = 1;
    }
  }
}
