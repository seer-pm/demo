---
name: seer-integration
description: Integrate with the Seer prediction market protocol: create markets, resolve, split/merge/redeem positions, trade on AMMs, and call the app HTTP API. Use when the user wants to build or integrate with Seer, interact with prediction markets, create markets, trade outcome tokens, or use the Seer API.
---

# Seer integration

When helping with Seer (prediction markets, MarketFactory, Router, trading, or the app API), use the project docs as the single source of truth.


## Where to look

| Goal | Document |
|------|----------|
| **Integration guides (overview and full map)** | [0-intro.md](https://github.com/seer-pm/demo/raw/main/integration-docs/0-intro.md) |
| Create market | [2-create-market.md](https://github.com/seer-pm/demo/raw/main/integration-docs/2-create-market.md) |
| Resolve market | [3-resolve-market.md](https://github.com/seer-pm/demo/raw/main/integration-docs/3-resolve-market.md) |
| Split / merge / redeem | [4-split-merge-and-redeem.md](https://github.com/seer-pm/demo/raw/main/integration-docs/4-split-merge-and-redeem.md) |
| Conditional markets | [5-conditional-market.md](https://github.com/seer-pm/demo/raw/main/integration-docs/5-conditional-market.md) |
| Futarchy markets | [6-futarchy-markets.md](https://github.com/seer-pm/demo/raw/main/integration-docs/6-futarchy-markets.md) |
| Trading (AMMs) | [7-trading.md](https://github.com/seer-pm/demo/raw/main/integration-docs/7-trading.md) |
| HTTP API (get-market, search, portfolio, etc.) | [8-api.md](https://github.com/seer-pm/demo/raw/main/integration-docs/8-api.md) |

## Flow

1. **Setup** – viem public + wallet clients: [1-viem-setup.md](https://github.com/seer-pm/demo/raw/main/integration-docs/1-viem-setup.md). Use contract addresses from the codebase (e.g. `SEER_CONTRACTS`, config).
2. **Create or fetch market** – contracts: [2-create-market.md](https://github.com/seer-pm/demo/raw/main/integration-docs/2-create-market.md); app data: [8-api.md](https://github.com/seer-pm/demo/raw/main/integration-docs/8-api.md) (`get-market`, `markets-search`).
3. **Positions** – split/merge/redeem via Router: [4-split-merge-and-redeem.md](https://github.com/seer-pm/demo/raw/main/integration-docs/4-split-merge-and-redeem.md).
4. **Trading** – Swapr (Gnosis) / Uniswap V3 (other chains): [7-trading.md](https://github.com/seer-pm/demo/raw/main/integration-docs/7-trading.md).
5. **Resolve** – [3-resolve-market.md](https://github.com/seer-pm/demo/raw/main/integration-docs/3-resolve-market.md); then redeem via [4-split-merge-and-redeem.md](https://github.com/seer-pm/demo/raw/main/integration-docs/4-split-merge-and-redeem.md).

Read the linked doc for the task at hand; avoid inferring ABIs or addresses from other sources.
