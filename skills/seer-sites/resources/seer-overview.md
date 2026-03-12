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

Frontends usually do not call these contracts directly. Instead, they:

1. Use SDK calls to **fetch data** (markets, prices, positions).
2. Use SDK helpers to **build and send transactions** via a wallet (e.g., viem + wallet client).

---

## High-level flows

### 1. Setup (clients and configuration)

Before calling Seer contracts or HTTP APIs, set up:

- A **public client** and a **wallet client** (via viem).
- Network / chain configuration supported by Seer.
- Contract addresses (from SDK helpers or configuration).

See: [1-viem-setup.md](https://github.com/seer-pm/demo/raw/main/integration-docs/1-viem-setup.md).

### 2. Create a market

Steps:

1. Collect market parameters from the user:
   - Question, description, and metadata.
   - Outcomes (e.g., YES, NO).
   - Bounds or scalar range (if applicable).
   - Collateral token, oracle, and resolution details.
2. Use SDK helpers to create the market via `MarketFactory` / Router.
3. Optionally, seed liquidity in an AMM.

See: [2-create-market.md](https://github.com/seer-pm/demo/raw/main/integration-docs/2-create-market.md).

### 3. Trade / bet on outcomes

Steps:

1. Fetch market data and prices (contracts, subgraph, or HTTP API).
2. Ensure user has:
   - Connected wallet.
   - Sufficient collateral balance.
   - Approved the collateral token for the Router or AMM.
3. Use an SDK helper to execute the trade (buy/sell outcome tokens).

See: [7-trading.md](https://github.com/seer-pm/demo/raw/main/integration-docs/7-trading.md).

### 4. Split, merge, redeem positions

After trading or receiving positions, users may:

- **Split** collateral into outcome tokens.
- **Merge** complementary outcomes back into collateral.
- **Redeem** positions for collateral once a market is resolved.

These flows are usually exposed as actions in a **market detail** page.

See: [4-split-merge-and-redeem.md](https://github.com/seer-pm/demo/raw/main/integration-docs/4-split-merge-and-redeem.md).

### 5. Resolve a market

When the outcome is known:

1. Authorized resolver submits the result on-chain.
2. Users with winning positions redeem for collateral.

See:

- [3-resolve-market.md](https://github.com/seer-pm/demo/raw/main/integration-docs/3-resolve-market.md)
- [4-split-merge-and-redeem.md](https://github.com/seer-pm/demo/raw/main/integration-docs/4-split-merge-and-redeem.md)

---

## Recommended frontend architecture

- Use a set of **hooks** (often from `@seer-pm/react`) as the integration boundary:
  - `useMarkets` – list markets.
  - `useMarket` – single market details.
  - `useApproveTokens` – token approvals.
  - `useTrade` or equivalent – place trades.
  - Additional hooks for create, resolve, and portfolio flows.

- Build **pages** and **widgets** on top of these hooks:
  - Markets list page.
  - Market detail + trade widget.
  - Create market wizard.
  - Resolve market panel.
  - Portfolio / positions overview.

This separation lets design-driven components (from Stitch) consume clean, focused hooks without re-implementing Seer logic.

