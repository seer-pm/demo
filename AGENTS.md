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
