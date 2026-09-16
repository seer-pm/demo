# Agent notes

Living gotchas and invariants for working in this monorepo. Keep entries short and actionable. Add new lessons here as they come up.

## GraphQL queries go through codegen

Every subgraph query lives in `packages/seer-pm-sdk/queries/*.graphql` and is reached through the
generated SDK. Do **not** send a query string inline from application code, even a one-off: an
inline query is untyped, so a renamed field or a filter that does not exist on the schema fails at
runtime against the gateway instead of at `tsc`.

Rules:

- Add the operation to the `.graphql` file for its schema, then run `yarn generate` (or
  `yarn workspace @seer-pm/sdk generate:gql`) and call it as `sdk.<OperationName>(variables)`.
- `queries/swapr.graphql` is generated against **both** the Algebra and the algebra-farming
  schemas, so farming operations belong there too; `queries/uniswap.graphql` covers the other DEX
  chains. See `packages/seer-pm-sdk/codegen.ts` for the schema-to-document mapping.
- Use the generated filter types and enums (`Position_Filter`, `OrderDirection`, …) rather than
  string literals, so a bad field is a compile error.
- `generated/` is gitignored and built by `yarn generate`; commit the `.graphql` change only.
- Codegen reads each schema from **one** endpoint (the Uniswap one from mainnet), so a generated
  type is not proof the entity exists on every deployment. `positions` is the live example: it
  exists on mainnet and Gnosis, and not on the Optimism or Base deployments. Availability per chain
  stays a runtime check.
- Give a new operation its own name rather than widening one the UI already uses; extra fields are
  paid for on every existing call site.

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

## Comments justify the current code, not its history

A comment that recounts the previous implementation, or the bug being fixed, costs the next reader
space without telling them anything they can act on, because they never saw the old version. Write the
constraint that makes the present code correct, in the present tense. That is the part that stays
true as the file changes, and the part that stops someone from undoing the decision.

Rules:

- Do not name a past state: no "the previous limit of 30 rejected…", no "it used to match every
  URL", no "a fixed near-white fill stayed light in dark mode".
- State the standing reason instead.
  ✗ `// The previous limit of 30 rejected ordinary corporate addresses.`
  ✓ `// RFC 5321 caps an email path at 254 characters. A lower ceiling turns ordinary long`
  `// corporate addresses into a "badly formatted" error, which points the user at the wrong problem.`
- Conditional phrasing about a **different** choice is fine, because it justifies the code as
  written: "a match here would put the portfolio page on unknown paths that belong to the 404 page".
- Applies to inline comments, JSDoc blocks and CSS comments alike.
- The before/after belongs in the commit message and the PR description, where a reader is asking
  what changed. A comment answers why the code is the way it is.

## Write prose without em dashes

An em dash (—) reads as machine-written, and it is usually standing in for punctuation that carries
more meaning. Use a colon when the second half explains the first, a full stop when it is a separate
thought, and parentheses or commas for an aside.

Rules:

- Do not use `—` in user-facing copy, code comments, JSDoc, or Markdown in this repo.
- Pick the punctuation that does the work:
  ✗ `It is optional — without one you appear under your ENS name.`
  ✓ `It is optional. Without one you appear under your ENS name.`
  ✗ `Rendered only when there are any — a handful of users — so the header keeps its height.`
  ✓ `Rendered only when there are any (a handful of users), so the header keeps its height.`
- Hyphens in compound words (`mark-to-market`) and minus signs are unrelated and stay as they are.
