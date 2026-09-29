# @seer-pm/sdk

SDK for the [Seer](https://seer.pm) prediction market protocol. Use it to create markets, resolve, split/merge/redeem positions, and trade outcome tokens from your app.

## Install

```bash
npm install @seer-pm/sdk
# or
yarn add @seer-pm/sdk
# or
pnpm add @seer-pm/sdk
```

### Peer dependencies

This package expects the following peer dependencies in your project. Install them if they are not already present:

| Package           | Version        |
| ----------------- | -------------- |
| `@wagmi/core`     | `>=2.0.0`      |
| `graphql-request` | `>=5.0.0`      |
| `graphql-tag`     | `>=2.0.0`      |
| `viem`            | `>=2.0.0`      |
| `wagmi`           | `^2.0.0` or `^3.0.0` |

Example with npm:

```bash
npm install @seer-pm/sdk @wagmi/core graphql-request graphql-tag viem wagmi
```

## Usage

```ts
import type { Market } from "@seer-pm/sdk";
import { fetchAmmQuote } from "@seer-pm/sdk";
import { fetchMarket, fetchMarkets } from "@seer-pm/sdk/markets-fetch";

const { markets } = await fetchMarkets({ chainsList: ["100"], orderBy: "volumeUSD", orderDirection: "desc" });
const market = await fetchMarket(100, markets[0].id);
market.liquidityUSD; // pooled liquidity, USD
market.volumeUSD; // lifetime swap volume, collateral leg (cash), USD
market.volumeNotionalUSD; // lifetime swap volume, shares valued at one collateral unit each (notional), USD
```

AMM quotes go through **Lens smart quoter**; swaps run on the chosen DEX router (`fetchAmmQuote` / `AmmTrade`).

See the [integration docs](https://github.com/seer-pm/demo/tree/main/docs/developers) for full flows (create market, resolve, [trading](https://github.com/seer-pm/demo/blob/main/docs/developers/guides/trading.mdx), API).

## Publishing (maintainers)

From the monorepo root:

```bash
yarn workspace @seer-pm/sdk build
npm publish -w @seer-pm/sdk
```

Only the `packages/seer-sdk` package is published to npm; the rest of the repository is not included in the published tarball.

## License

MIT
