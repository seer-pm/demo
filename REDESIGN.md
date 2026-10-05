# Seer redesign handoff

## Branches and review

- `main`: clean upstream baseline. No design edits here.
- `redesign/brand-foundation`: shared palette, surfaces and control styling. First reviewable change.
- `redesign/app-shell`: shared app layout, homepage and initial visual pass across existing routes. Its review PR targets `redesign/brand-foundation`.
- Portfolio and Airdrop review components are integrated into `redesign/app-shell`. Subsequent feature commits can be reviewed or cherry-picked separately.
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
- `/portfolio` in design-preview mode now integrates the approved dashboard: interactive chart, all position columns, search/sort/expansion and the connected Airdrop view. Public account routes use the same overview and table components.
- Missing account API fields remain explicitly unavailable: historical P&L series, realized/unrealized breakdown, remaining cost basis, average entry, gross traded amount and settlement-aware potential payout. Review fixtures never substitute for real account data.

## Run the read-only preview

Use Node 20+ and Corepack/Yarn 4. Install dependencies with `corepack yarn install`, generate SDK files with `corepack yarn workspace @seer-pm/sdk generate` if needed, then run `corepack yarn workspace @seer-pm/sdk build`. From the repository root:

```sh
corepack yarn workspace @seer-pm/web preview:design
```

Open http://localhost:3000. The command runs Netlify locally and enables an explicit design-preview flag. It fetches allowlisted public data from app.seer.pm without forwarding credentials; wallet connections and writes are disabled. This local address works only on the machine running the preview. A shareable hosting deployment is still pending.

Public portfolio and airdrop data can be viewed by opening a trader from the leaderboard. In design-preview mode, the bare `/portfolio` route opens the labelled illustrative dashboard. In normal mode it retains the wallet connection prompt. Creation forms can be explored as drafts, without submitting transactions. Policy documents that depend on subgraph configuration are unavailable in this limited preview; configure the normal app environment to validate them.

Validation: TypeScript and the production build with the preview flag passed; category-filter tests and preview access-control tests passed. Browser checks covered home in both themes, mobile navigation, filters, market detail, leaderboard, public portfolio/airdrop, profile and draft market creation. Authenticated account actions, transactions and every secondary route have not been validated. Keep normal production environment setup for those checks.

## Portfolio and homepage review update

- Match the supplied homepage layout with search in the header, compact category navigation, dense cards and binary outcome actions. Non-binary markets select their actual outcome; do not invent a separate No token. Scalar and multi-categorical visualization is retained.
- Integrate the approved portfolio layout as React components within existing routes. Review data is isolated in `portfolio-review-data.ts` and used only when design-preview mode is active without an account route.
- Chart ranges, keyboard/pointer inspection, position search, profit sorting, expanded details and Airdrop navigation are interactive. Archived filtering can only display rows supplied by the API.
- Order-book cost totals and a conversational creation preview are included in the subsequent feature commits.

Account integration contract: summary totals are USD; rows remain in native collateral. Supply historical USD P&L observations (excluding external deposits/withdrawals) and realized/unrealized values for each supported range. Supply remaining acquisition cost and average entry after partial sales/transfers, gross buy/sell volume and settlement-aware payout per position. Account API values must account for liquidity holdings and linked TradeExecutors before replacing unavailable states. The review uses the original illustrative figures, including the original USD/native-collateral distinction.

Review captures: [homepage](docs/review/homepage.png), [portfolio overview](docs/review/portfolio-overview.png), [positions](docs/review/portfolio-positions.png). Production preview build and four targeted tests pass. Browser checks include six chart ranges, keyboard inspection, filtering, expanded rows, Airdrop navigation, homepage filters, outcome deep links and 390px layouts. Wallet transactions remain untested.

## Market cards, order book and creation studio

- Lighter lavender outcome buttons (`#A275EF`, an implementation choice), compact reference spacing and clickable outcome rows. No extra View/Select badges. Keep actual Seer outcomes; categorical outcomes do not have invented No tokens.
- Order-book Total is the cumulative sum of each level’s price × shares, starting at the best price independently for asks and bids. Asks are then reversed for display. Round only for display; show the pool quote-token symbol. This is an approximate pool-depth cost excluding fees, not an executable swap quote. Horizontal liquidity charts remain denominated in shares.
- In design-preview mode, `/create-market` opens a chat studio with editable drafts, rule refinement and review cards. Responses are local templates, labelled simulated. No AI request or publishing is performed. The manual form remains accessible, and remains the default outside preview mode.
- Developer connection: replace the local `send` response templates with a server AI endpoint returning structured draft patches. Validate category, deadline, source and oracle-compatible rules before mapping a reviewed draft into the existing creation form. Never invoke wallet submission from an AI response. Drafts currently persist only while the studio remains mounted, including switches to the manual form.

Review capture: [market studio](docs/review/market-studio.png). Unit tests cover independent cumulative cost ordering/precision and chat draft validation/refinement. No new fees or creation business rules are introduced.

## Price leaders and Brazilian order-book demo

- Purple marks the highest-priced valid outcome, including No when it leads. Cards rank outcomes before taking the first two, retain original token links, highlight tied leaders, and leave missing prices unhighlighted. All open market types use outcome rows.
- The Brazilian election page includes a demo ladder for Flávio Bolsonaro in design-preview mode only. Five or ten levels, keyboard/hover inspection and cumulative cost/proceeds use the same calculation as the live liquidity ladder.
- Sample price/share rows were copied from the public Seer pool display on 4 Oct 2026, rounded as displayed. They are frozen review data, not a live quote. Asks total 6.51 then 15.58 sDAI for the first two levels; bids total 2.41 then 9.18 sDAI. Fees are excluded.
- Validation: TypeScript and seven targeted tests passed. Browser checks confirmed every visible homepage card’s leader and the demo’s rows, five/ten-level control and mobile layout.

Captures: [price leaders](docs/review/homepage-leaders.png), [Brazilian order book](docs/review/brazil-order-book.png).

## Sticky whole-app comparison

Run `corepack yarn workspace @seer-pm/web preview:compare`, then open **http://localhost:3002**. Keep that terminal running. The launcher reuses the redesign on port 3000 when available and starts an isolated original baseline on port 3001. The comparison toolbar stays outside both pages, follows navigation and query parameters, and retains each frame's scroll/state when its route has not changed. The URL stores the selected version and route for local sharing/bookmarking.

The baseline is exported from commit `60423441`, not a new fork or a second tracked copy. A temporary directory receives only preview runtime adapters (public read proxy, disabled wallets, comparison bridge). Its original navigation and layout remain intact; the Brazilian pool panel uses the same controlled fixture with cumulative shares for comparison. Installed dependencies and generated SDK files are shared with this checkout. No branch is switched and `main` is untouched. The small bridge is injected by Vite only with `VITE_DESIGN_PREVIEW=true`; normal production builds have no comparison controls or bridge.

Both sides fetch public data independently, so this compares designs rather than guaranteeing identical data timestamps. Wallet-only baseline routes retain their original connection requirements; the proposed portfolio's labelled sample mode is a new feature. This is a local review tool, not a public hosted URL.

The Brazilian demo now appears only inside each valid outcome's **View pool details → Liquidity** panel. Flávio's rows remain the captured sample; other outcomes show clearly labelled illustrative depth. No demo ladder appears above the market. Normal production pool data remains unchanged.

Validation: TypeScript, six pool/demo tests and the comparison routing test passed. Browser checks covered both versions, same-market switching, sticky scrolling, and opening Flávio/Lula pool details. Browser automation has intermittent iframe-click limitations; standalone page checks verify the underlying interactions.

Outcome headers in Proposed toggle their pool details when clicked; nested links and action buttons retain their own actions. Both preview ladders show exactly five levels per side with no row selector. Current accumulates shares; Proposed accumulates price × shares. The global design-preview notice is removed and the discovery header uses equal 12px top/bottom spacing.

## Interaction rules

- Binary previews keep Yes above No, independent of price; purple marks the highest unrounded price. Categorical previews retain price ranking. Equal leaders share the highlight.
- Desktop homepage navigation has equal free space on both sides between search and filter controls.
- Outcome details are independent disclosures. Opening one never closes another. Expand/collapse is immediate, without delayed page scrolling or nested scroll boxes. Users keep control of the viewport; no motion is required, including for reduced-motion users.
- Native disclosure buttons support Enter/Space and expose `aria-expanded` and `aria-controls`. Other links and actions in the row retain their own behavior.
- Reference: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/ for disclosure semantics; https://www.nngroup.com/articles/accordions-complex-content/ for predictable open/closed state.

Validation: seven ranking/demo tests, TypeScript and targeted Biome checks pass.

## Individual market design

Market detail pages share the brand surfaces, purple convergence motif and typography used across the redesign. A stronger market title and compact status/metrics area lead into a bordered history chart, outcome disclosures, trade panel and activity section. Existing trading, resolution and verification controls remain available.

Chart data and calculations are unchanged. The chart has purple-led, contrasting series colours, subtle horizontal gridlines, a 340px canvas, keyboard-operable range and legend buttons, and theme-aware axis labels. Redundant right-edge series labels are removed; the legend and hover readout retain values. Mobile statistics wrap and chart tooltips stay within the page.

Validation: TypeScript and targeted Biome checks; browser review of light/dark layouts, legend toggles and the 390px mobile layout.

## Event workspace

The market detail layout uses an integrated event-and-chart surface beside a persistent desktop trade ticket. The selected outcome's current odds and name sit above the history chart. Compare outcomes / Selected outcome changes the chart scope; historical pool data retains its existing meaning and source.

Generic markets use compact outcome rows: the row is a keyboard-operable depth disclosure, while Trade selects that outcome and opens the existing mobile ticket when applicable. Liquidity links, conditional-market creation and pool panels remain accessible in each expanded row. Non-generic markets retain their specialized outcome controls. Rules and settlement, verification and resolution actions are available in the expandable details section. Mint, merge and redeem are grouped beneath the desktop ticket.

UX reference: https://agg.market/events/wvo4e2zfkcvaja9k03s1lgen . Seer retains its own branding and trading functionality; aggregation-specific venue routing is not reproduced.

Validation: TypeScript and targeted Biome; browser checks for outcome selection, depth disclosure, chart scope and mobile trade drawer (390px, no horizontal overflow).

## Compact desktop market layout

The chart and surrounding spacing adapt to desktop viewport height so initial outcome rows and the complete default swap form are visible sooner. Short laptop viewports use a 230px plot; taller ones use 300-360px. The selected-outcome toolbar is a compact single line and the redundant Outcomes heading is removed to reclaim space. Typography and controls retain their sizes while redundant spacing is reduced. Additional error messages or expanded tools can naturally increase the form height.

Desktop uses independent scrolling: market content follows the document while the trade column stays beneath the header. Overflow in the trade column scrolls separately, including expanded mint/merge tools, without passing scroll gestures into the market column. Its offset tracks the header height. Mobile retains the existing trade drawer.

## Market polish

Thin SVG ribbons span the market page, with non-scaling strokes for crisp rendering. The compact desktop header brings the first outcome rows above the fold without reducing plot height. Activity is the default information tab; discussion is an on-demand disclosure so quiet markets do not display a large empty comment panel. Invalid resolution retains its real settlement meaning, with a neutral shield icon and explicit price-unavailable text instead of NA.
