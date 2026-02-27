# Create a market

To create a market, call one of the four creation functions on the **MarketFactory** contract. Each function corresponds to a market type; you pass a single **CreateMarketParams** struct. On success, the function returns the new **market contract address** (you can also read it from the `NewMarket` event).

---

## Which function to use

| Function | When to use it | Main parameter rules |
|----------|----------------|------------------------|
| `createCategoricalMarket` | Single-choice question (e.g. "Who will win?" → one of A, B, C). | `outcomes`: ≥ 2 labels. No bounds. |
| `createMultiCategoricalMarket` | Multi-choice question (e.g. "Which teams qualify?" → any subset). | `outcomes`: ≥ 2 labels. No bounds. |
| `createScalarMarket` | Numeric outcome in a range (e.g. "Temperature in °C?" between 0 and 50). | `outcomes`: exactly 2 (e.g. "Lower", "Higher"). **Required:** `lowerBound`, `upperBound` in wei (1e18). |
| `createMultiScalarMarket` | Several numeric questions (e.g. one per city). | `outcomes`: ≥ 2 (e.g. city names). Use `questionStart`, `questionEnd`, `outcomeType` to build each question; market name is built from these. No bounds. |

---

## Parameters: `CreateMarketParams`

All four functions take one argument: a struct with the following fields. Optional/conditional fields are noted.

| Parameter | Type | Required / notes |
|-----------|------|------------------|
| `marketName` | string | Yes (except multi scalar: there it is built from questionStart/outcomeType/questionEnd). |
| `outcomes` | string[] | Yes. Categorical/multi categorical: ≥ 2. Scalar: exactly 2. Multi scalar: ≥ 2. |
| `questionStart` | string | Multi scalar only: prefix for each per-outcome question. |
| `questionEnd` | string | Multi scalar only: suffix for each per-outcome question. |
| `outcomeType` | string | Multi scalar only: placeholder in market name (e.g. "City"). |
| `parentMarket` | address | Optional. Set for conditional markets; use `0x0` for root markets. |
| `parentOutcome` | uint256 | Optional. For conditional markets: index of the parent outcome this market depends on. |
| `category` | string | Yes. Reality.eth category (e.g. "politics", "weather"). |
| `lang` | string | Yes. Language code (e.g. "en_US"). |
| `lowerBound` | uint256 | Scalar only. Minimum value in **wei** (use e.g. `parseEther("0")`). |
| `upperBound` | uint256 | Scalar only. Maximum value in **wei** (e.g. `parseEther("50")`). Must be > lowerBound. |
| `minBond` | uint256 | Yes. Minimum bond for answering on Reality.eth (in wei). |
| `openingTime` | uint32 | Yes. Unix timestamp when the question becomes answerable. |
| `tokenNames` | string[] | Yes. ERC20 symbol for each outcome (≤31 chars), one per entry in `outcomes`. |

**Getting the new market address:** the contract returns it; you can also parse the `NewMarket` event from the transaction logs.

**Struct shape (for ABI / viem):**

```solidity
struct CreateMarketParams {
    string marketName;   // Used in categorical, multi categorical, scalar. In multi scalar: built from questionStart + outcomeType + questionEnd.
    string[] outcomes;   // Market outcomes (excludes INVALID_RESULT)
    string questionStart;   // For multi scalar: prefix of each Reality question
    string questionEnd;     // For multi scalar: suffix of each Reality question
    string outcomeType;    // For multi scalar: placeholder in market name, e.g. "City"
    uint256 parentOutcome; // Optional: conditional outcome index
    address parentMarket;  // Optional: parent conditional market
    string category;       // Reality question category
    string lang;           // Reality question language
    uint256 lowerBound;    // Only for scalar: minimum value (in wei, 1e18 units)
    uint256 upperBound;    // Only for scalar: maximum value (in wei, 1e18 units)
    uint256 minBond;       // Reality min bond
    uint32 openingTime;    // Reality question opening time
    string[] tokenNames;   // ERC20 name for each outcome (≤31 chars; SER-INVALID is automatic)
}
```

---

## Using @seer-pm/sdk (recommended)

The **@seer-pm/sdk** provides `getCreateMarketParams`, `getCreateMarketExecution`, and `MarketTypes`. Use your viem clients to send the transaction. See [Viem setup](1-viem-setup.md#dependencies) for installation.

### SDK: create categorical market

Only required: `marketType`, `marketName`, `outcomes`, `openingTime`, `minBond`, `chainId`. Other fields have defaults (e.g. `tokenNames` are derived from `outcomes`, `category` defaults to `"misc"`).

```typescript
import { getPublicClient, getWalletClient } from "./viem-setup";
import { gnosis } from "viem/chains";
import { getCreateMarketExecution, getNewMarketFromLogs, MarketTypes } from "@seer-pm/sdk";

const chain = gnosis;
const publicClient = getPublicClient(chain);
const walletClient = getWalletClient(chain, process.env.PRIVATE_KEY! as `0x${string}`);
const chainId = chain.id;

const execution = getCreateMarketExecution({
  marketType: MarketTypes.CATEGORICAL,
  marketName: "Who will win the election?",
  outcomes: ["Alice", "Bob", "Carol"],
  openingTime: Math.floor(Date.now() / 1000),
  minBond: 10000000000000000n,
  chainId,
  category: "politics", // optional; default "misc"
});

const hash = await walletClient.sendTransaction(execution);
const receipt = await publicClient.waitForTransactionReceipt({ hash });

const newMarketAddress = getNewMarketFromLogs(receipt.logs);
if (!newMarketAddress) throw new Error("NewMarket event not found in receipt");
```

### SDK: create multi categorical market

```typescript
const execution = getCreateMarketExecution({
  marketType: MarketTypes.MULTI_CATEGORICAL,
  marketName: "Which teams will qualify? (select all that apply)",
  outcomes: ["Team A", "Team B", "Team C"],
  openingTime: Math.floor(Date.now() / 1000),
  minBond: 10000000000000000n,
  chainId,
  category: "sports",
});

const hash = await walletClient.sendTransaction(execution);
```

### SDK: create scalar market

For scalar, **`lowerBound`**, **`upperBound`** and **`unit`** are also required. Bounds are in wei (1e18); use viem's `parseEther` (e.g. 0 and 50 for a 0–50 °C range):

```typescript
import { parseEther } from "viem";
import { getCreateMarketExecution, MarketTypes } from "@seer-pm/sdk";

const execution = getCreateMarketExecution({
  marketType: MarketTypes.SCALAR,
  marketName: "What will be the temperature in °C on 2025-03-01?",
  outcomes: ["Lower", "Higher"],
  lowerBound: parseEther("0"),
  upperBound: parseEther("50"),
  unit: "°C",
  openingTime: Math.floor(Date.now() / 1000),
  minBond: 10000000000000000n,
  chainId,
  category: "weather",
});

const hash = await walletClient.sendTransaction(execution);
```

### SDK: create multi scalar market

For multi scalar, the name must include the `[outcomeType]` placeholder (e.g. `[City]`) so the SDK can build `questionStart` / `questionEnd` / `outcomeType` via `getQuestionParts`. **`unit`** is required for the question suffix.

```typescript
const execution = getCreateMarketExecution({
  marketType: MarketTypes.MULTI_SCALAR,
  marketName: "What will be the max temperature in °C on 2025-03-01 in [City]?",
  outcomes: ["Berlin", "Madrid", "Paris"],
  unit: "°C",
  openingTime: Math.floor(Date.now() / 1000),
  minBond: 10000000000000000n,
  chainId,
  category: "weather",
});
```

You can use `getCreateMarketParams(props)` if you only need the params struct (with all fields filled) for a custom flow.

---
