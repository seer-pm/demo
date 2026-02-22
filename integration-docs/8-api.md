# Netlify Functions – Reference

Documentation for the serverless functions exposed by the app. Useful for integrations, frontend, and AI tools working with this codebase.

**Base URL:** `https://app.seer.pm`

Functions are available at: `https://app.seer.pm/.netlify/functions/<function-name>`

---

## get-market

Fetches a single market by ID or URL/slug. Merges real-time subgraph data with cached database data (including verification status) for maximum accuracy.

| Field | Detail |
|-------|--------|
| **Method** | `POST` |
| **URL** | `https://app.seer.pm/.netlify/functions/get-market` |
| **Content-Type** | `application/json` |

### Body (JSON)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chainId` | number | Yes | Network ID (SupportedChain). |
| `id` | string (Address) | Yes* | Market ID (0x…). *Required if `url` is not provided. |
| `url` | string | Yes* | Market slug/URL (e.g. human-readable name). *Required if `id` is not provided. |

### Response 200

Serialized market object: all `bigint` fields are returned as `string` for JSON compatibility.

```ts
type SerializedMarket = {
  chainId: number;
  factory?: `0x${string}`;
  outcomesSupply: string;
  liquidityUSD: number;
  incentive: number;
  hasLiquidity: boolean;
  categories: string[];
  poolBalance: ({
    token0: { symbol: string; balance: number };
    token1: { symbol: string; balance: number };
  } | null)[];
  odds: (number | null)[];
  creator?: string | null;
  blockTimestamp?: number;
  verification?: { status: "verified" | "verifying" | "challenged" | "not_verified"; itemID?: string; deadline?: number };
  images?: { market: string; outcomes: string[] };
  index?: number;
  url: string;
  id: `0x${string}`;
  type: "Generic" | "Futarchy";
  marketName: string;
  outcomes: readonly string[];
  collateralToken: `0x${string}`;
  collateralToken1: `0x${string}`;
  collateralToken2: `0x${string}`;
  wrappedTokens: `0x${string}`[];
  parentMarket: {
    id: `0x${string}`;
    conditionId: `0x${string}`;
    payoutReported: boolean;
    payoutNumerators: readonly string[];
  };
  parentOutcome: string;
  parentCollectionId: `0x${string}`;
  conditionId: `0x${string}`;
  questionId: `0x${string}`;
  templateId: string;
  questions: Array<{
    id: `0x${string}`;
    arbitrator: `0x${string}`;
    opening_ts: number;
    timeout: number;
    finalize_ts: number;
    is_pending_arbitration: boolean;
    best_answer: `0x${string}`;
    bond: string;
    min_bond: string;
    base_question: `0x${string}`;
  }>;
  openingTs: number;
  finalizeTs: number;
  encodedQuestions: readonly string[];
  lowerBound: string;
  upperBound: string;
  payoutReported: boolean;
  payoutNumerators: readonly string[];
};
```

### Errors

- **400** – `Missing request body` or `Missing required parameters: chainId and (id or url)`.
- **404** – `Market not found`.
- **500** – Internal server error.

---

## markets-search

Search and list markets with filters, pagination, and sorting. Queries one or multiple chains; when `VITE_TESTNET_WEBSITE=1` only Sepolia is used.

| Field | Detail |
|-------|--------|
| **Method** | `POST` |
| **URL** | `https://app.seer.pm/.netlify/functions/markets-search` |
| **Content-Type** | `application/json` |

### Body (JSON) – Search parameters

All optional. Defaults in the handler: `limit=1000`, `page=1`, chains = all supported (or Sepolia only on testnet).

| Parameter | Type | Description |
|-----------|------|-------------|
| `chainsList` | string[] | Chain IDs (e.g. `["100","1"]`). Empty = all. |
| `type` | `"Generic"` \| `"Futarchy"` \| `""` | Market type. |
| `parentMarket` | string (Address) | Filter by parent market. |
| `marketName` | string | Search by name. |
| `categoryList` | string[] | Categories. |
| `marketStatusList` | MarketStatus[] | Statuses (e.g. Active, Closed). |
| `verificationStatusList` | VerificationStatus[] | Verification status. |
| `showConditionalMarkets` | boolean | Include conditional markets. |
| `showMarketsWithRewards` | boolean | Include markets with rewards. |
| `minLiquidity` | number | Minimum liquidity. |
| `creator` | string (Address) | Creator address. |
| `participant` | string (Address) | Participant address. |
| `orderBy` | Market_OrderBy | Sort field (subgraph). |
| `orderDirection` | `"asc"` \| `"desc"` | Sort direction. |
| `marketIds` | string[] | Explicit list of market IDs. |
| `limit` | number | Results per page (default 1000). |
| `page` | number | Page number (default 1). |

### Response 200

```json
{
  "markets": [ /* SerializedMarket[] */ ],
  "count": number,
  "pages": number
}
```

### Errors

- **400** – `Missing request body`.
- **500** – `Internal server error`.

---

## get-token-transactions

Returns top holders and recent transactions for one or more tokens (per chain).

| Field | Detail |
|-------|--------|
| **Method** | `GET` |
| **URL** | `https://app.seer.pm/.netlify/functions/get-token-transactions` |
| **Parameters** | Query string |

### Query params

| Parameter | Required | Description |
|-----------|----------|-------------|
| `tokenIds` | Yes | Comma-separated list of token addresses. |
| `chainId` | Yes | Chain ID. Must be in `SUBGRAPHS.tokens`. |

### Response 200

```json
{
  "topHolders": {
    "<tokenId>": [ { "address": string, "balance": string } ]
  },
  "recentTransactions": [ /* TokenTransfer[] – last 100 */ ],
  "totalTokens": number,
  "totalTransactions": number,
  "tokenIds": string[],
  "chainId": number
}
```

`recentTransactions` items use the following type (`value` is serialized as string in JSON):

```ts
type TokenTransfer = {
  id: string | number;
  chain_id: number; // SupportedChain
  token: `0x${string}`;
  tx_hash: string;
  block_number: number;
  timestamp: number;
  value: string; // serialized bigint
  from: `0x${string}`;
  to: `0x${string}`;
};
```

Header: `Cache-Control: public, max-age=300` (5 minutes).

### Errors

- **400** – Missing `tokenIds` or `chainId`, invalid `chainId`, or unsupported chain.
- **500** – Internal server error.

---

## get-transactions

Transaction history for an account on a chain: swaps, liquidity (LP add/remove), and CTF events (split/merge/redeem).

| Field | Detail |
|-------|--------|
| **Method** | `GET` |
| **URL** | `https://app.seer.pm/.netlify/functions/get-transactions` |
| **Parameters** | Query string |

### Query params

| Parameter | Required | Description |
|-----------|----------|-------------|
| `account` | Yes | Wallet address. |
| `chainId` | Yes | Chain ID (number). |
| `startTime` | No | Unix timestamp start (number). |
| `endTime` | No | Unix timestamp end (number). |
| `eventType` | No | `swap` \| `lp` \| `ctf`. If omitted, all event types are returned. |

### Response 200

Array of `TransactionData`, sorted by `blockNumber` descending:

```ts
type TransactionType = "split" | "merge" | "redeem" | "swap" | "lp" | "lp-burn";

interface TransactionData {
  marketName: string;
  marketId: string;
  type: TransactionType;
  blockNumber: number;
  collateral: `0x${string}`;
  collateralSymbol?: string;
  timestamp?: number;
  transactionHash?: string;

  // split/mint/merge
  amount?: string;
  payout?: string;

  // swap
  tokenIn?: string;
  tokenOut?: string;
  tokenInSymbol?: string;
  tokenOutSymbol?: string;
  amountIn?: string;
  amountOut?: string;
  price?: string;

  // lp
  token0?: string;
  token1?: string;
  token0Symbol?: string;
  token1Symbol?: string;
  amount0?: string;
  amount1?: string;
}
```

### Errors

- **400** – Missing `account` or `chainId`, invalid `eventType`, or non-numeric `startTime`/`endTime`.
- **500** – Internal server error.

---

## get-portfolio

Positions for an account on a chain: outcome token balances per market, with market data, outcome, collateral, and redeemed prices.

| Field | Detail |
|-------|--------|
| **Method** | `GET` |
| **URL** | `https://app.seer.pm/.netlify/functions/get-portfolio` |
| **Parameters** | Query string |

### Query params

| Parameter | Required | Description |
|-----------|----------|-------------|
| `account` | Yes | Wallet address. |
| `chainId` | Yes | Chain ID (number). |

### Response 200

Array of `PortfolioPosition`:

```ts
interface PortfolioPosition {
  tokenName: string;
  tokenId: `0x${string}`;
  tokenIndex: number;
  marketId: `0x${string}`;
  marketName: string;
  marketStatus: string;
  tokenBalance: number;
  tokenValue?: number;
  tokenPrice?: number;
  outcome: string;
  collateralToken: `0x${string}`;
  parentMarketId?: `0x${string}`;
  parentMarketName?: string;
  parentOutcome?: string;
  redeemedPrice: number;
  marketFinalizeTs: number;
  outcomeImage?: string;
  isInvalidOutcome: boolean;
}
```

Only positions with balance > 0 are included; for closed markets, only those that qualify as winning per payout.

### Errors

- **400** – Missing `account` or `chainId`, or non-numeric `chainId`.
- **500** – Internal server error.

---

## markets-charts

Returns chart data (hourly price/volume) for markets. If IDs are provided, only those markets; if omitted, all cached chart data.

| Field | Detail |
|-------|--------|
| **Method** | `GET` |
| **URL** | `https://app.seer.pm/.netlify/functions/markets-charts` |
| **Parameters** | Query string |

### Query params

| Parameter | Required | Description |
|-----------|----------|-------------|
| `ids` | No | Comma-separated list of market IDs (Address). If omitted, all cached charts are returned. IDs are validated with `isAddress`. |

### Response 200

Object keyed by `marketId` with each market’s chart data (array of series):

```ts
// Value per marketId:
type ChartDataSeries = {
  name: string;
  type: string;
  data: number[][]; // [timestamp, value] pairs (e.g. [unixSec, price])
}[];

// Full response type:
type MarketsChartsResponse = Record<`0x${string}`, ChartDataSeries>;
```

### Errors

- **400** – `ids` was provided but no valid address: `No valid market IDs provided`.
- **500** – Supabase or internal error.

---

## Quick reference for AIs

| Function | Method | Key params | Typical use |
|----------|--------|------------|-------------|
| get-market | POST | `chainId` + `id` or `url` | Single market page or API |
| markets-search | POST | Body with filters and `page`/`limit` | Listings, search, filters |
| get-token-transactions | GET | `tokenIds`, `chainId` | Token holders and activity |
| get-transactions | GET | `account`, `chainId`, opt. `eventType`, `startTime`, `endTime` | Wallet transaction history |
| get-portfolio | GET | `account`, `chainId` | Wallet positions/portfolio |
| markets-charts | GET | opt. `ids` (market IDs) | Price/volume charts per market |

All responses are JSON. Errors return `{ "error": "message" }` with the appropriate HTTP status code.
