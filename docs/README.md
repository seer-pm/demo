# Seer documentation

The Seer docs site, built with [Mintlify](https://mintlify.com). It replaces the
two GitBook spaces that used to hold the documentation:

- `seer-3.gitbook.io/seer-documentation` — the app and developer docs
- `seer-2.gitbook.io/seer` — the whitepaper extract

## Running it

```bash
cd docs
npm install
npm run dev        # http://localhost:3000
npm run check      # broken-link check
node scripts/check-nav.mjs   # docs.json vs files on disk, and image references
```

`docs/` is deliberately **not** a yarn workspace: hoisting Mintlify next to the
app's React causes a version clash in the CLI, so it keeps its own
`node_modules`.

## Layout

Three tabs, defined in `docs.json`:

| Tab | Content |
|-----|---------|
| **Whitepaper** | `index.mdx` + `whitepaper/` — why previous prediction markets failed, the Seer solution, applications |
| **Documentation** | `documentation/`, `getting-started/`, `app/`, `resources/` — using the app |
| **Developers** | `developers/` — guides, HTTP API, diagrams, subgraph, contract reference |

Images live under `images/<page path>/`.

## Where the content came from

`scripts/migrate-gitbook.mjs` performed the one-shot import from GitBook: it
walks each space's `sitemap-pages.xml`, pulls the raw Markdown GitBook serves at
`<url>.md`, recovers images from the rendered HTML, converts GitBook syntax
(`{% hint %}`, `<figure>`, embeds) to Mintlify components, and rewrites every
internal link. It is kept for reference and is re-runnable, but **the `.mdx`
files are now the source of truth** — edit them directly.

The developer guides originally came from the repo's `integration-docs/`
folder, which was newer than GitBook; that folder was removed once the guides
landed here.
