# @seer-pm/react

React hooks for interacting with Seer prediction markets.

This package exposes reusable hooks that work with `@seer-pm/sdk` and Wagmi.

## Hooks

### Markets

- **`useMarket`** — Single market by ID and chain. Prefers subgraph data, falls back to on-chain.
- **`useGraphMarket`** — Market from subgraph by `marketId` and `chainId`.
- **`useMarketQuestions`** — Overrides a market’s question data with on-chain data (e.g. `best_answer`, reopened status).
- **`useMarkets`** — List of markets with filters: `type`, `marketName`, `categoryList`, `marketStatusList`, `verificationStatusList`, `chainsList`, `creator`, `participant`, `orderBy`, `orderDirection`, `marketIds`, `limit`, `page`, etc.

### Pools & liquidity

- **`useMarketPools`** — Pools for a market (Swapr on Gnosis, Uniswap on Mainnet/Optimism/Base).
- **`useMarketHasLiquidity`** — Whether a market (or a specific outcome) has liquidity.
- **`useMarketOdds`** — Current odds for a market; requires liquidity check to be resolved.
- **`useComputedPoolAddresses`** — Computed pool addresses for a market’s token pairs.

### Tokens

- **`useTokenInfo`** — Metadata for a single token (address, chain).
- **`useTokensInfo`** — Metadata for multiple tokens; also fills per-token cache for `useTokenInfo`.
- **`useTokenBalance`** — Balance of a token for an owner (supports native token).
- **`useTokenBalances`** — Balances for multiple tokens for an owner.

### Trading & quotes

- **`useQuoteTrade`** — Unified quote for buy/sell: uses CoW (or instant swap) when enabled or for Seer Credits, otherwise Swapr (Gnosis) or Uniswap (Mainnet/Optimism/Base).
- **`useCowQuote`** — CoW Protocol quote.
- **`useSwaprQuote`** — Swapr (Algebra) quote (Gnosis).
- **`useUniswapQuote`** — Uniswap quote (Mainnet, Optimism, Base).

### Approvals

- **`useMissingApprovals`** — Tokens that still need approval for a given spender/amounts (supports ERC-7702).
- **`useMissingTradeApproval`** — Wrapper over `useMissingApprovals` for a single trade (base currency and approve address from trade).
- **`useApproveTokens`** — Mutation to approve a token for a spender (with optional tx notifier).

### Positions (split / merge / redeem)

- **`useSplitPosition`** — Split collateral into outcome tokens. Supports legacy and ERC-7702 (batched approvals + split).
- **`useMergePositions`** — Merge outcome tokens back to collateral. Supports legacy and ERC-7702.
- **`useRedeemPositions`** — Redeem winning/merged positions. Supports legacy and ERC-7702.

### Account / chain support

- **`useCheck7702Support`** — Whether the connected account supports ERC-7702 (atomic batch) for the current chain.

## Peer dependencies

This package expects the following peer dependencies in your project. Install them if they are not already present:

| Package                 | Version   |
| ----------------------- | --------- |
| `@seer-pm/sdk`          | `0.0.1`   |
| `@tanstack/react-query` | `>=5.0.0` |
| `@wagmi/core`           | `>=2.0.0` |
| `react`                 | `>=18.0.0`|
| `viem`                  | `>=2.0.0` |
| `wagmi`                 | `>=2.0.0` |

Example with npm (includes the SDK and its peers):

```bash
npm install @seer-pm/react @seer-pm/sdk @tanstack/react-query @wagmi/core react viem wagmi
```
