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

- **Frontend framework**: React + TypeScript.
- **Routing**: Any (Next.js, React Router, etc.). Examples are framework-agnostic and focus on components/pages.
- **Seer SDK packages**:
  - `@seer-pm/sdk` – core integration (contracts + HTTP API).
  - `@seer-pm/react` – hooks and React utilities around the core SDK.
- **Chain + wallet setup**: viem public + wallet clients as described in Seer integration docs.

Whenever possible, follow the patterns from the official Seer integration docs instead of inventing new flows or parameters.

---

## Where to look (Seer integration docs)

For any Seer-related behavior, refer to the **integration docs** hosted in the `seer-pm/demo` repository:

| Goal | Document |
|------|----------|
| Overview & integration map | [0-intro.md](https://github.com/seer-pm/demo/raw/main/integration-docs/0-intro.md) |
| viem + Seer setup (clients, chain) | [1-viem-setup.md](https://github.com/seer-pm/demo/raw/main/integration-docs/1-viem-setup.md) |
| Create a market | [2-create-market.md](https://github.com/seer-pm/demo/raw/main/integration-docs/2-create-market.md) |
| Resolve a market | [3-resolve-market.md](https://github.com/seer-pm/demo/raw/main/integration-docs/3-resolve-market.md) |
| Split / merge / redeem positions | [4-split-merge-and-redeem.md](https://github.com/seer-pm/demo/raw/main/integration-docs/4-split-merge-and-redeem.md) |
| Conditional markets | [5-conditional-market.md](https://github.com/seer-pm/demo/raw/main/integration-docs/5-conditional-market.md) |
| Futarchy markets | [6-futarchy-markets.md](https://github.com/seer-pm/demo/raw/main/integration-docs/6-futarchy-markets.md) |
| Trading via AMMs | [7-trading.md](https://github.com/seer-pm/demo/raw/main/integration-docs/7-trading.md) |
| HTTP API (get market, search, portfolio, etc.) | [8-api.md](https://github.com/seer-pm/demo/raw/main/integration-docs/8-api.md) |

Treat these documents as the **authoritative reference** for:

- Contract addresses and networks (or how to derive them from the SDK).
- Required parameters (bounds, oracle, question, outcomes, etc.).
- How splitting/merging/redeeming positions works.
- How trading works on AMMs (Swapr/Uniswap V3).

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
   - Call SDK helpers to deploy the market via `MarketFactory` / Router.

4. **Resolve market flow**
   - UI for the resolver to submit the result.
   - After resolution, guide the user to **redeem** positions as needed.

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
- `MarketDetailPage.tsx` – single market detail page with a trade form.

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
   - Prefer extracting Seer logic into hooks (e.g., `useMarkets`, `useMarket`, `useTrade`, `useApproveTokens`) and then consuming those hooks in UI components.

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

---

## How this skill interacts with other skills

- **With `stitch-loop`**:
  - `stitch-loop` can generate page structure and navigation for a multi-page site.
  - `seer-sites` should provide the **Seer-specific integration details and examples** so the generated pages correctly use `@seer-pm/sdk` and `@seer-pm/react`.

- **With generic React skills (e.g., react-components)**:
  - Use `seer-sites` to decide how to wire Seer data and actions.
  - Use generic React skills to refine component structure, styling, and design system alignment.

Always keep Seer integration semantics (from the integration docs above) as the top priority when resolving conflicts between design-driven and protocol-driven requirements.

