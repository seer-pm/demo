---
name: seer-sites
description: Build multi-page prediction market sites using the Seer protocol with @seer-pm/sdk, @seer-pm/react, and Stitch (stitch-loop).
---

# Seer Sites

This skill builds **prediction market websites** using the **Seer protocol**.
It is designed to work with **Stitch**, especially the `stitch-loop` skill, to generate complete multi-page apps that integrate with:

- `@seer-pm/sdk` – low-level Seer contracts + HTTP API integration
- `@seer-pm/react` – React hooks and helpers for Seer UIs

Use this skill when the goal is to:

- Generate **full sites** or **flows** for prediction markets.
- Use **Seer** as the prediction-market backend.
- Integrate Seer with React-based frontends produced from Stitch designs.

**Generic Stitch prompt:** For building Seer sites with Google Stitch (or similar design tools), use **`skills/seer-sites/STITCH_PROMPT.md`**. It defines the fixed Seer data model (market/outcome fields, screens, redeem flow) and a **Part 2 placeholder** where the user specifies site name, identity, network, and aesthetic. Copy Part 1 as-is; fill Part 2 per project.

This skill does **not** define on-chain contracts or ABIs; instead, it relies on the Seer SDK as the single source of truth for integration details.

---

## When to use this skill

Use `seer-sites` when:

- The user mentions **prediction markets**, **Seer**, or **@seer-pm**.
- The task is to build or modify a **web app** (multi-page or single-page) that:
  - Lists markets.
  - Shows market detail pages.
  - Lets users **create**, **trade on**, or **resolve** markets.
- The UI is being generated from **Stitch** designs and should call Seer via `@seer-pm/sdk` / `@seer-pm/react`.

Do **not** use this skill when:

- The task is purely smart-contract level development unrelated to Seer.
- The app should integrate with a different prediction market protocol.

---

## Tech stack & assumptions

- **Package manager**: Prefer **yarn v1** over npm for install scripts and lockfiles, unless the user explicitly asks for npm or another manager.
- **Frontend framework**: React + TypeScript.
- **Routing**: Any (Next.js, React Router, etc.). Examples are framework-agnostic and focus on components/pages.
- **Wallet connection**: A wallet-connection UI library is always required. Prefer **ConnectKit** (works with wagmi) unless the user specifies another (e.g. RainbowKit, WalletConnect modal).
- **Seer SDK packages**: Install both `@seer-pm/sdk` (core integration: contracts + HTTP API) and `@seer-pm/react` (hooks and React utilities). The project must use **wagmi v2** and **viem v2** (e.g. `wagmi` and `viem` at major version 2) and satisfy the peer dependencies of both packages: `wagmi`, `@wagmi/core`, `viem`, `react`; `@seer-pm/react` also needs `@seer-pm/sdk`, `@tanstack/react-query`; `@seer-pm/sdk` also needs `graphql-request` and `graphql-tag` for HTTP API usage.
- **Notifications**: `react-toastify` wired through Seer notifier helpers – see `skills/seer-sites/examples/toastify.tsx` and ensure `ToastContainer` + `import "react-toastify/dist/ReactToastify.css";` are added at app root.
- **Vite projects**: Install **vite-plugin-node-polyfills**, register it in `vite.config.ts` (add `nodePolyfills()` to the `plugins` array), and add a `define` block so Node-style globals and `process.env` are available for SDK/wagmi deps:
  ```ts
  import { nodePolyfills } from 'vite-plugin-node-polyfills'

  // In defineConfig:
  plugins: [nodePolyfills(), /* ...existing plugins (e.g. react()) */],
  define: {
    'process.env': {},
    'global': {},
  },
  ```

Whenever possible, follow the patterns from the official Seer integration docs instead of inventing new flows or parameters.

---

## Where to look (Seer integration docs)

For any Seer-related behavior, refer to the **integration docs** hosted in the `seer-pm/demo` repository:

| Goal | Document / API |
|------|----------------|
| Create a market | `useCreateMarket` from `@seer-pm/react` (pass `txNotifier`, `isFutarchyMarket`, `onSuccess`; mutation accepts `CreateMarketProps`) |
| Resolve a market | `useResolveMarket` from `@seer-pm/react` (pass `txNotifier`, optional `onSuccess`; mutation accepts `ResolveMarketProps` with `market`) |
| Split / merge / redeem positions | `useSplitPosition`, `useMergePositions`, and `useRedeemPositions` from `@seer-pm/react` |
| Trading via AMMs | `useQuoteTrade` and `useTrade` from `@seer-pm/react` |
| Block explorer / pool URLs | `getBlockExplorerUrl`, `getTokenExplorerUrl`, `getLiquidityUrlByMarket`, `getPoolExplorerUrl` from `@seer-pm/sdk` |

Treat these documents as the **authoritative reference** for:

- Contract addresses and networks (or how to derive them from the SDK).
- Required parameters (bounds, oracle, question, outcomes, etc.).
- How split/merge/redeem work via `useSplitPosition`, `useMergePositions`, and `useRedeemPositions`.
- How trading works via `useQuoteTrade` (quotes) and `useTrade` (execute) on AMMs (Swapr/Uniswap V3).

---

## Conditional markets

A **conditional market** is a market that depends on a specific outcome of an existing **parent** market. The child question is only relevant if the parent resolves to that outcome (e.g. “Will X happen by 2026?” conditional on “Will X happen by 2025?” resolving to **Yes**).

**Detecting and using parent data**

- **`market.parentMarket`** – Address of the parent market contract. If it is the zero address, the market is a **root** (non-conditional) market; otherwise it is a conditional (child) market.
- **`market.parentOutcome`** – Index of the parent outcome this market is conditional on (e.g. `0` = first outcome, often “Yes”). Only meaningful when `parentMarket` is not zero.

**Creating a conditional market**

Use the same flow as for root markets (`useCreateMarket` and `CreateMarketProps`), but set **`parentMarket`** to the parent market address and **`parentOutcome`** to the chosen parent outcome index. Use the zero address for `parentMarket` when creating a root market.

**Split, merge, and redeem on conditional markets**

The same hooks apply (`useSplitPosition`, `useMergePositions`, `useRedeemPositions`), but the **collateral token** for a conditional market is not the chain’s base collateral (e.g. sDAI). It is the **parent’s outcome token** for the outcome the child is conditional on. That token is the one at index `market.parentOutcome` in the parent market’s outcome tokens (e.g. `parentMarket.wrappedTokens[parentOutcome]` or the equivalent from the SDK). So for a child market you pass that parent outcome token as the collateral when calling split/merge/redeem.

**After resolution**

Redeeming winning positions on a **resolved conditional** market returns **parent outcome tokens**, not base collateral. To show or offer “redeem to base collateral” in one step when the parent is a root and already resolved, the SDK or contracts may expose a helper (e.g. ConditionalRouter); otherwise the user redeems the child and then redeems the parent separately.

**Nested conditionals**

Markets can be conditional on other conditional markets. The rule is the same at each level: the “collateral” for a child is always the parent’s wrapped outcome token for the outcome the child depends on. If the parent resolves to a different outcome, that child branch has no redeemable value.

---

## Golden flows for UI generation

When generating sites or components, prioritize these high-level flows:

1. **Markets list page**
   - Fetch a paginated list of markets (contracts and/or HTTP API).
   - Show basic info: title, outcomes, liquidity/volume, status (open, closed, resolved).
   - Each entry links to a **market detail page**.

2. **Market detail page**
   - Fetch a single market (by ID / address / slug).
   - Show market question, outcomes, bounds, resolution status.
   - Show outcome prices and liquidity (from Seer AMM / subgraph, if available).
   - Provide a **trade/bet form** that:
     - Ensures token approval (e.g., stablecoin or collateral token) before trade.
     - Submits trades using Seer Router / AMM helpers via the SDK.

3. **Create market flow**
   - Form to define question, outcomes, collateral token, bounds, and other Seer-specific parameters.
   - Use `useCreateMarket` from `@seer-pm/react` with a `txNotifier`; the mutation accepts full `CreateMarketProps`. The hook handles both regular markets and futarchy proposals via `isFutarchyMarket`.

4. **Resolve market flow**
   - Use `useResolveMarket` from `@seer-pm/react` (pass `txNotifier`, optional `onSuccess`; mutation accepts `{ market }`) for the resolver to submit the result.
   - After resolution, guide the user to **redeem** positions via `useRedeemPositions`.

Prefer composing screens from smaller components:

- `MarketsList`
- `MarketCard`
- `MarketDetail`
- `TradeForm`
- `CreateMarketForm`
- `ResolveMarketForm`

---

## Examples in this skill

This skill includes example React components in `skills/seer-sites/examples/` that demonstrate recommended integration patterns:

- `MarketsPage.tsx` – high-level markets listing page.
- `MarketDetailPage.tsx` – single market detail page with an outcomes list and trade widget (`SwapWidget`).
- `SwapWidget.tsx` – full-featured trade widget wired to Seer AMMs and notifiers.
- `OutcomesList.tsx` – list outcomes on a market detail page: user balance per outcome, image and name, current odds, link to token contract in block explorer, and link to pool (or create pool).

Use these examples as **primary reference** for:

- Import paths for `@seer-pm/sdk` and `@seer-pm/react`.
- Naming of props, hooks, and state for Seer UIs.
- How to wire Seer data to visual components generated from Stitch.

When generating new components, align with these examples unless the user explicitly requests a different structure.

---

## Behavior guidelines for this skill

When using `seer-sites`:

1. **Prefer SDK helpers over raw contract calls**
   - Use functions and hooks from `@seer-pm/sdk` / `@seer-pm/react` instead of manually encoding transactions whenever possible.
   - Only fall back to raw contract calls if no suitable helper exists and the integration docs clearly describe the call.

2. **Keep Seer-specific logic in dedicated hooks/utilities**
   - Prefer extracting Seer logic into hooks (e.g., `useMarkets`, `useMarket`, `useTrade`, `useCreateMarket`, `useApproveTokens`) and then consuming those hooks in UI components.

3. **Respect network & address configuration**
   - Do not hardcode contract addresses or chain IDs.
   - Use SDK functions or configuration from the integration docs to determine addresses.

4. **Handle loading, error, and empty states**
   - All Seer-powered pages should:
     - Show loading indicators while fetching markets/data.
     - Handle and surface errors in a user-friendly way.
     - Show empty states (no markets, no positions, etc.).

5. **Security & UX**
   - Avoid constructing arbitrary call data strings from user input.
   - Surface transaction details clearly before users confirm trades or market creation.
   - Follow the approval-then-trade pattern required by ERC-20 tokens.

6. **Avoid imaginary providers or APIs**
   - **Do NOT invent components like `SeerProvider`** – there is no provider exported from `@seer-pm/react`.
   - Use your app's existing React/wagmi provider setup (for example, `WagmiConfig` / `Config` from `wagmi`) and then call Seer hooks (`useMarkets`, `useMarket`, `useCreateMarket`, `useTrade`, `useApproveTokens`, etc.) directly inside components.
   - Before introducing any new Seer hook or helper, **check `@seer-pm/react` exports and the examples in `skills/seer-sites/examples/*.tsx`**; if it is not there, do not assume it exists.

7. **No mock data**
   - Do **not** use mock or hardcoded market data in React components.
   - **Home page (markets list):** Always load markets with `useMarkets()` from `@seer-pm/react` (or the equivalent hook that matches your filter, e.g. by creator). Pass the returned data to the UI.
   - **Market detail page:** Always load the single market with `useMarket(marketId, chainId)` from `@seer-pm/react`. Pass the returned market to the header, outcomes list, and trading widget.
   - Handle loading and empty states from the hook results; do not fall back to fake data for design or demos.

---

## How this skill interacts with other skills

- **With `stitch-loop`**:
  - `stitch-loop` can generate page structure and navigation for a multi-page site.
  - `seer-sites` should provide the **Seer-specific integration details and examples** so the generated pages correctly use `@seer-pm/sdk` and `@seer-pm/react`.

- **With generic React skills (e.g., react-components)**:
  - Use `seer-sites` to decide how to wire Seer data and actions.
  - Use generic React skills to refine component structure, styling, and design system alignment.

Always keep Seer integration semantics (from the integration docs above) as the top priority when resolving conflicts between design-driven and protocol-driven requirements.

