---
name: seer-integration
description: Integrate with the Seer prediction market protocol: create markets, resolve, split/merge/redeem positions, trade on AMMs, and call the app HTTP API. Use when the user wants to build or integrate with Seer, interact with prediction markets, create markets, trade outcome tokens, or use the Seer API.
---

# Seer integration

When helping with Seer (prediction markets, MarketFactory, Router, trading, or the app API), use the project docs as the single source of truth.


## Where to look

| Goal | Document |
|------|----------|
| **Integration guides (overview and full map)** | [introduction.mdx](https://github.com/seer-pm/demo/raw/main/docs/developers/introduction.mdx) |
| Create market | [create-a-market.mdx](https://github.com/seer-pm/demo/raw/main/docs/developers/guides/create-a-market.mdx) |
| Resolve market | [resolve-a-market.mdx](https://github.com/seer-pm/demo/raw/main/docs/developers/guides/resolve-a-market.mdx) |
| Split / merge / redeem | [split-merge-and-redeem.mdx](https://github.com/seer-pm/demo/raw/main/docs/developers/guides/split-merge-and-redeem.mdx) |
| Conditional markets | [conditional-markets.mdx](https://github.com/seer-pm/demo/raw/main/docs/developers/guides/conditional-markets.mdx) |
| Futarchy markets | [futarchy-markets.mdx](https://github.com/seer-pm/demo/raw/main/docs/developers/guides/futarchy-markets.mdx) |
| Trading (AMMs) | [trading.mdx](https://github.com/seer-pm/demo/raw/main/docs/developers/guides/trading.mdx) |
| HTTP API (get-market, search, portfolio, etc.) | [api.mdx](https://github.com/seer-pm/demo/raw/main/docs/developers/api.mdx) |
| Collateral profiles (multi-primary) | [collateral-profiles.mdx](https://github.com/seer-pm/demo/raw/main/docs/developers/guides/collateral-profiles.mdx) |

## Flow

1. **Setup** – viem public + wallet clients: [configuration.mdx](https://github.com/seer-pm/demo/raw/main/docs/developers/configuration.mdx). Contract addresses from **@seer-pm/sdk** (`getMarketFactoryAddress`, `getRouterAddress`, etc.).
2. **Create or fetch market** – contracts: [create-a-market.mdx](https://github.com/seer-pm/demo/raw/main/docs/developers/guides/create-a-market.mdx); app data: [api.mdx](https://github.com/seer-pm/demo/raw/main/docs/developers/api.mdx) (`get-market`, `markets-search`).
3. **Positions** – split/merge/redeem via Router: [split-merge-and-redeem.mdx](https://github.com/seer-pm/demo/raw/main/docs/developers/guides/split-merge-and-redeem.mdx).
4. **Trading** – Lens smart quoter (`fetchAmmQuote` / `AmmTrade`): [trading.mdx](https://github.com/seer-pm/demo/raw/main/docs/developers/guides/trading.mdx).
5. **Resolve** – [resolve-a-market.mdx](https://github.com/seer-pm/demo/raw/main/docs/developers/guides/resolve-a-market.mdx); then redeem via [split-merge-and-redeem.mdx](https://github.com/seer-pm/demo/raw/main/docs/developers/guides/split-merge-and-redeem.mdx).

Read the linked doc for the task at hand; avoid inferring ABIs or addresses from other sources.
