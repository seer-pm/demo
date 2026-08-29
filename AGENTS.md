# Agent notes

Living gotchas and invariants for working in this monorepo. Keep entries short and actionable. Add new lessons here as they come up.

## Netlify functions / SDK imports

Netlify functions under `web/netlify/functions` import `@seer-pm/sdk`. Netlify bundles them with `esbuild` (`web/netlify.toml`). Pulling large ESM trees into that graph can fail at runtime with:

`EMFILE: too many open files`

Rules:

- Do **not** add value imports of `@wagmi/core`, `wagmi`, or large packages like `date-fns` to the main SDK barrel (`packages/seer-pm-sdk/src/index.ts`). Type-only imports are fine if they erase at compile time.
- Client-only code that needs wagmi (e.g. SIWE `signIn`) belongs on a dedicated subpath such as `@seer-pm/sdk/sign-in`, not the barrel.
- Prefer existing SDK subpath imports from Netlify when available (`@seer-pm/sdk/market`, `@seer-pm/sdk/market-types`, `@seer-pm/sdk/create-market`, `@seer-pm/sdk/subgraph`, etc.).
- When the web app imports a new SDK subpath in local Vite, add a matching alias in `web/vite.config.ts` (and `web/tsconfig.json` paths) **before** the catch-all `@seer-pm/sdk` → `src/index.ts` alias; otherwise Vite resolves `@seer-pm/sdk/<subpath>` against `index.ts` and fails.
- Historical context: EMFILE / wagmi cleanup in PRs `#324` and `#447`.

## `netlify dev` in a git worktree

The Netlify CLI resolves the repo root with `findUp('.git', { type: 'directory' })`. In a git
worktree `.git` is a **file** (`gitdir: …`), so that lookup skips it and `repositoryRoot` ends up
wrong. Since `web/netlify.toml` writes its paths relative to the repo root (`directory =
"web/netlify/functions"`, `command = "node ./web/server"`), every path then gains a second `web/`
segment and dev fails with:

`Error: Cannot find module '…/worktree-branch/web/web/server'`

Running from the repo root does not help either — the CLI does not look inside `web/` for the
config, so it falls back to a static server.

Workaround, from `web/`, overriding just the two paths that double up:

```bash
npx netlify dev -f netlify/functions -c "node ./server" --target-port 3000 -p 8888
```

Functions then serve at `http://localhost:8888/.netlify/functions/<name>`, with project env vars
injected from the linked site. Notes:

- A `*-background` function returns **202 immediately** and runs async — the result (and any auth
  rejection) only shows up in the dev server log, not in the HTTP response.
- Functions import `@seer-pm/sdk` through the package `exports` map, i.e. through `dist/`. Build it
  first or they fail at runtime with `Cannot find module '…/@seer-pm/sdk/dist/market.mjs'`:
  `yarn workspace @seer-pm/sdk build` (needs `generated/` — run `yarn generate` if it is missing).
