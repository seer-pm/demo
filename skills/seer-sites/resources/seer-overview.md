---
title: Seer Sites Overview
description: High-level overview of Seer prediction market flows and how frontends should interact with the Seer SDK.
---

# Seer prediction markets – overview

Seer is a **prediction market protocol**. Frontends interact with Seer via:

- `@seer-pm/sdk` – contract + HTTP API integration helpers.
- `@seer-pm/react` – React hooks that wrap common flows.

Always prefer using SDK helpers over manually encoding contract calls.

---

## Core concepts

- **Market** – a Seer market configuration that can contain either:
  - A **single question** (categorical, multi-categorical, or scalar), or
  - **Multiple questions** (multi-scalar), sharing common collateral and configuration.
- **Outcome tokens / positions** – ERC-20 style tokens that represent claims on one or more outcomes across the market's question(s).
- **Collateral token** – ERC-20 token used to buy positions (e.g., stablecoin).
- **Router / MarketFactory** – contracts that create markets and manage splitting, merging, and redeeming positions.
- **AMM** – automated market maker (e.g., Swapr, Uniswap V3) that prices and trades outcome tokens.
- **Conditional market** – a market that depends on a parent market resolving to a specific outcome. Use `market.parentMarket` (zero = root market) and `market.parentOutcome` (index of the parent outcome). For split/merge/redeem on a conditional market, the collateral token is the **parent’s outcome token** at that index, not the chain’s base collateral. Same hooks (`useSplitPosition`, `useMergePositions`, `useRedeemPositions`) apply; creation uses `CreateMarketProps` with `parentMarket` and `parentOutcome` set.

Frontends usually do not call these contracts directly. Instead, they:

1. Use SDK calls to **fetch data** (markets, prices, positions).
2. Use SDK helpers to **build and send transactions** via a wallet (e.g., viem + wallet client).

---

## High-level flows

### 1. Setup

Install both SDKs (`@seer-pm/sdk` and `@seer-pm/react`). The project must use **wagmi v2** and **viem v2** (major version 2) for chain and wallet (public + wallet clients) and satisfy the peer dependencies of both packages: `wagmi`, `@wagmi/core`, `viem`, `react`; `@seer-pm/react` also requires `@seer-pm/sdk` and `@tanstack/react-query`; `@seer-pm/sdk` also requires `graphql-request` and `graphql-tag` for HTTP API usage. Contract addresses and supported networks are provided by the SDK.

### 2. Create a market

Steps:

1. Collect market parameters from the user:
   - Question, description, and metadata.
   - Outcomes (e.g., YES, NO).
   - Bounds or scalar range (if applicable).
   - Collateral token, oracle, and resolution details.
2. Use `useCreateMarket` from `@seer-pm/react` (pass `txNotifier`, `isFutarchyMarket`, `onSuccess`; mutation accepts `CreateMarketProps`) to create the market via `MarketFactory` / Router.
3. Optionally, seed liquidity in an AMM.

### 3. Trade / bet on outcomes

Steps:

1. Fetch market data and prices (contracts, subgraph, or HTTP API).
2. Ensure user has:
   - Connected wallet.
   - Sufficient collateral balance.
   - Approved the collateral token for the Router or AMM.
3. Use `useQuoteTrade` for quotes and `useTrade` from `@seer-pm/react` to execute the trade (buy/sell outcome tokens).

### 4. Split, merge, redeem positions

After trading or receiving positions, users may:

- **Split** collateral into outcome tokens.
- **Merge** complementary outcomes back into collateral.
- **Redeem** positions for collateral once a market is resolved.

These flows are usually exposed as actions in a **market detail** page. Use `useSplitPosition`, `useMergePositions`, and `useRedeemPositions` from `@seer-pm/react`.

### 5. Resolve a market

When the outcome is known:

1. Authorized resolver submits the result on-chain.
2. Users with winning positions redeem for collateral.

Use `useResolveMarket` from `@seer-pm/react` (pass `txNotifier`, optional `onSuccess`; mutation accepts `{ market }`). After resolution, users redeem via `useRedeemPositions` from `@seer-pm/react`.

---

## Recommended frontend architecture

- Use a set of **hooks** (often from `@seer-pm/react`) as the integration boundary — **do not use mock data**; always read from the SDK:
  - `useMarkets()` – list markets (use on the home page).
  - `useMarket(marketId, chainId)` – single market details (use on the market detail page).
  - `useApproveTokens` – token approvals.
  - `useTrade` or equivalent – place trades.
  - `useCreateMarket`, `useResolveMarket`, and additional hooks for portfolio flows.

- Build **pages** and **widgets** on top of these hooks:
  - Markets list page.
  - Market detail + trade widget.
  - Create market wizard.
  - Resolve market panel.
  - Portfolio / positions overview.

This separation lets design-driven components (from Stitch) consume clean, focused hooks without re-implementing Seer logic.

