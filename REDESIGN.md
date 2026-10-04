# Seer redesign handoff

## Branches and review

- `main`: clean upstream baseline. No design edits here.
- `redesign/brand-foundation`: shared palette, surfaces and control styling. First reviewable change.
- `redesign/app-shell`: shared app layout, homepage and initial visual pass across existing routes. Its review PR targets `redesign/brand-foundation`.
- Next: separate Portfolio and Airdrop UX branches after visual review.
- Each review PR in this private repository should target the branch containing its prerequisites. Keep main as the baseline during design review.
- An integration branch may collect reviewed commits for a whole-app preview. Do not submit that aggregate branch as a single oversized upstream PR.
- Amend existing routes and components. Add reusable components where necessary; do not keep duplicate production versions of every page.

Baseline: `seer-pm/demo` commit `60423441a71dd4eead5a026a4cff93fbd4c6f4f3`.
Local upstream source: https://github.com/seer-pm/demo
Private development repository: https://github.com/Schofield99/New-Seer-Website. This is an independent repository retaining upstream history, not a GitHub-network fork. Internal review PRs work here. For an upstream PR, transfer the reviewed commits to a GitHub fork of seer-pm/demo, or have the Seer developers cherry-pick them; do not change this repository visibility without Joseph's approval.

## Brand reference

https://www.behance.net/gallery/252825507/Seer-Brand-Identity-App-Redesign

Confirmed anchors: purple `#7D33FF` (RGB 125/51/255), ink `#141223`, white `#FFFFFF`. Joseph supplied the labelled palette screenshot on 4 October 2026. The primary purple hex is derived from the printed RGB values; the lighter supporting swatches have no legible numeric labels.
Supporting surface and border colours are implementation choices derived from the portfolio concept, not exact published brand-kit values.
The homepage panel shows compact search/navigation, a horizontal category row, a four-column desktop market grid and purple outcome actions. Preserve live market data and supported outcome types when adapting it.

Joseph supplied the local New-seer-kit on 4 October 2026. The official identity is the original bird logo paired with the new lowercase wordmark. This choice supersedes the geometric symbol visible in the reference mockups. The exact supplied assets are preserved in web/public/assets/brand and the header uses them together. The logo PNG includes a purple background; preserve it until a transparent original is supplied. The wordmark SVG uses outlined paths, not a font. Joseph confirmed on 4 October 2026 that the app should retain its existing Open Sans UI font. No replacement font is required. Existing light/dark preference remains respected.

Homepage references are saved in docs/brand/home-light.png and home-dark.png. The converging multi-line streak is a core brand motif; its reference is in docs/brand/streak-reference.png. Use it in feature panels and branded moments with space around it, keeping data tables and trade controls clear. The curved-wave artwork is a secondary reference, not a replacement for the converging streak.

## Implementation order

1. Shared brand foundation, official logo and wordmark, and existing Open Sans UI typography.
2. App header, homepage/filter/category layout and market cards from the reference.
3. Apply the same components to market detail, portfolio, airdrop, leaderboard, profile, collections, creation flows, policies and remaining public routes. Inspect loading, empty, error and mobile states.
4. Review the complete visual base with Joseph.
5. Separate UX improvements per area; retain the portfolio metrics requirements as the model.

Do not fabricate P&L, cost basis, payout or airdrop history in the live app. Sample data is allowed only in an explicitly labelled review/demo mode. Business rules, contracts and wallet operations need separate review if changes are required.

## Preview and developer handover

Use the existing Netlify configuration in `web/netlify.toml` as the starting point. Connect the private development repository to a separate Netlify site, not Seer's production site. Configure environment values in the hosting service, never in Git. No deployment has been connected yet.

Keep one baseline preview tied to the baseline commit and one redesign preview tied to a named branch. Include the source commit in review notes. For each PR include a working preview link, before/after screenshots, 3-4 change bullets, validation results and outstanding data dependencies.

The earlier ChatGPT Site is an independent prototype and is not a preview of this repository.

## Current visual pass

- Official identity, converging streak, shared light/dark surfaces and responsive navigation now carry across existing routes.
- Homepage adds category navigation, compact filters and a responsive market grid while retaining live data and supported outcome types.
- Portfolio, airdrop, market detail, leaderboard and creation screens receive the same visual treatment. Existing business rules remain authoritative.
- This is the visual foundation for review. The prototype's P&L chart, extra position metrics and new airdrop UX still need separate data-backed work.

## Run the read-only preview

Use Node 20+ and Corepack/Yarn 4. Install dependencies with `corepack yarn install`, generate SDK files with `corepack yarn generate` if needed, then run `corepack yarn workspace @seer-pm/sdk build`. From the repository root:

```sh
corepack yarn workspace @seer-pm/web preview:design
```

Open http://localhost:3000. The command runs Netlify locally and enables an explicit design-preview flag. It fetches allowlisted public data from app.seer.pm without forwarding credentials; wallet connections and writes are disabled. This local address works only on the machine running the preview. A shareable hosting deployment is still pending.

Public portfolio and airdrop data can be viewed by opening a trader from the leaderboard. The disconnected portfolio is intentional without an account. Creation forms can be explored as drafts, without submitting transactions. Policy documents that depend on subgraph configuration are unavailable in this limited preview; configure the normal app environment to validate them.

Validation: TypeScript and the production build with the preview flag passed; category-filter tests and preview access-control tests passed. Browser checks covered home in both themes, mobile navigation, filters, market detail, leaderboard, public portfolio/airdrop, profile and draft market creation. Authenticated account actions, transactions and every secondary route have not been validated. Keep normal production environment setup for those checks.
