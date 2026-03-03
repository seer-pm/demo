# @seer-pm/react

React hooks for interacting with Seer prediction markets.

This package exposes reusable hooks that work with `@seer-pm/sdk`, such as:

- `useMarketPools`
- `useMarketHasLiquidity`
- `useMarketOdds`
- `useComputedPoolAddresses`

The hooks expect a `Market` type compatible with `@seer-pm/sdk` (using a numeric `chainId`).

