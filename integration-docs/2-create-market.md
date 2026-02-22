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

## Viem examples

We use the [Viem setup](1-viem-setup.md): `getPublicClient(chain)` and `getWalletClient(chain, process.env.PRIVATE_KEY)`. You need the **MarketFactory ABI** (create functions + `CreateMarketParams` tuple + `NewMarket` event). Addresses come from `SEER_CONTRACTS[chain.id]`.

### Shared: ABI and addresses

```typescript
import { getPublicClient, getWalletClient, SEER_CONTRACTS } from "./viem-setup";
import { gnosis } from "viem/chains"; // or mainnet, base, etc.

const chain = gnosis;
const publicClient = getPublicClient(chain);
const walletClient = getWalletClient(chain, process.env.PRIVATE_KEY! as `0x${string}`);
const chainId = chain.id;
const addresses = SEER_CONTRACTS[chainId];

const marketFactoryAbi = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "market", type: "address" },
      { indexed: false, internalType: "string", name: "marketName", type: "string" },
      { indexed: false, internalType: "address", name: "parentMarket", type: "address" },
      { indexed: false, internalType: "bytes32", name: "conditionId", type: "bytes32" },
      { indexed: false, internalType: "bytes32", name: "questionId", type: "bytes32" },
      { indexed: false, internalType: "bytes32[]", name: "questionsIds", type: "bytes32[]" },
    ],
    name: "NewMarket",
    type: "event",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "string", name: "marketName", type: "string" },
          { internalType: "string[]", name: "outcomes", type: "string[]" },
          { internalType: "string", name: "questionStart", type: "string" },
          { internalType: "string", name: "questionEnd", type: "string" },
          { internalType: "string", name: "outcomeType", type: "string" },
          { internalType: "uint256", name: "parentOutcome", type: "uint256" },
          { internalType: "address", name: "parentMarket", type: "address" },
          { internalType: "string", name: "category", type: "string" },
          { internalType: "string", name: "lang", type: "string" },
          { internalType: "uint256", name: "lowerBound", type: "uint256" },
          { internalType: "uint256", name: "upperBound", type: "uint256" },
          { internalType: "uint256", name: "minBond", type: "uint256" },
          { internalType: "uint32", name: "openingTime", type: "uint32" },
          { internalType: "string[]", name: "tokenNames", type: "string[]" },
        ],
        internalType: "struct MarketFactory.CreateMarketParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "createCategoricalMarket",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "string", name: "marketName", type: "string" },
          { internalType: "string[]", name: "outcomes", type: "string[]" },
          { internalType: "string", name: "questionStart", type: "string" },
          { internalType: "string", name: "questionEnd", type: "string" },
          { internalType: "string", name: "outcomeType", type: "string" },
          { internalType: "uint256", name: "parentOutcome", type: "uint256" },
          { internalType: "address", name: "parentMarket", type: "address" },
          { internalType: "string", name: "category", type: "string" },
          { internalType: "string", name: "lang", type: "string" },
          { internalType: "uint256", name: "lowerBound", type: "uint256" },
          { internalType: "uint256", name: "upperBound", type: "uint256" },
          { internalType: "uint256", name: "minBond", type: "uint256" },
          { internalType: "uint32", name: "openingTime", type: "uint32" },
          { internalType: "string[]", name: "tokenNames", type: "string[]" },
        ],
        internalType: "struct MarketFactory.CreateMarketParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "createMultiCategoricalMarket",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "string", name: "marketName", type: "string" },
          { internalType: "string[]", name: "outcomes", type: "string[]" },
          { internalType: "string", name: "questionStart", type: "string" },
          { internalType: "string", name: "questionEnd", type: "string" },
          { internalType: "string", name: "outcomeType", type: "string" },
          { internalType: "uint256", name: "parentOutcome", type: "uint256" },
          { internalType: "address", name: "parentMarket", type: "address" },
          { internalType: "string", name: "category", type: "string" },
          { internalType: "string", name: "lang", type: "string" },
          { internalType: "uint256", name: "lowerBound", type: "uint256" },
          { internalType: "uint256", name: "upperBound", type: "uint256" },
          { internalType: "uint256", name: "minBond", type: "uint256" },
          { internalType: "uint32", name: "openingTime", type: "uint32" },
          { internalType: "string[]", name: "tokenNames", type: "string[]" },
        ],
        internalType: "struct MarketFactory.CreateMarketParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "createMultiScalarMarket",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "string", name: "marketName", type: "string" },
          { internalType: "string[]", name: "outcomes", type: "string[]" },
          { internalType: "string", name: "questionStart", type: "string" },
          { internalType: "string", name: "questionEnd", type: "string" },
          { internalType: "string", name: "outcomeType", type: "string" },
          { internalType: "uint256", name: "parentOutcome", type: "uint256" },
          { internalType: "address", name: "parentMarket", type: "address" },
          { internalType: "string", name: "category", type: "string" },
          { internalType: "string", name: "lang", type: "string" },
          { internalType: "uint256", name: "lowerBound", type: "uint256" },
          { internalType: "uint256", name: "upperBound", type: "uint256" },
          { internalType: "uint256", name: "minBond", type: "uint256" },
          { internalType: "uint32", name: "openingTime", type: "uint32" },
          { internalType: "string[]", name: "tokenNames", type: "string[]" },
        ],
        internalType: "struct MarketFactory.CreateMarketParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "createScalarMarket",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
```

### Helper: build `CreateMarketParams` (tuple for viem)

```typescript
import type { Address } from "viem";

function createMarketParams(params: {
  marketName: string;
  outcomes: string[];
  questionStart?: string;
  questionEnd?: string;
  outcomeType?: string;
  parentMarket?: Address;
  parentOutcome?: bigint;
  category?: string;
  lang?: string;
  lowerBound?: bigint;
  upperBound?: bigint;
  minBond?: bigint;
  openingTime?: number;
  tokenNames: string[];
}) {
  return {
    marketName: params.marketName,
    outcomes: params.outcomes,
    questionStart: params.questionStart ?? "",
    questionEnd: params.questionEnd ?? "",
    outcomeType: params.outcomeType ?? "",
    parentOutcome: params.parentOutcome ?? 0n,
    parentMarket: params.parentMarket ?? "0x0000000000000000000000000000000000000000",
    category: params.category ?? "misc",
    lang: params.lang ?? "en_US",
    lowerBound: params.lowerBound ?? 0n,
    upperBound: params.upperBound ?? 0n,
    minBond: params.minBond ?? 0n,
    openingTime: params.openingTime ?? 0,
    tokenNames: params.tokenNames,
  };
}
```

### 1. Create Categorical market (viem)

```typescript
import { parseEventLogs } from "viem/utils";

const params = createMarketParams({
  marketName: "Who will win the election?",
  outcomes: ["Alice", "Bob", "Carol"],
  category: "politics",
  openingTime: Math.floor(Date.now() / 1000),
  minBond: 10000000000000000n, // 0.01 ETH in wei, adjust per chain
  tokenNames: ["ALICE", "BOB", "CAROL"],
});

const hash = await walletClient.writeContract({
  address: addresses.MarketFactory,
  abi: marketFactoryAbi,
  functionName: "createCategoricalMarket",
  args: [params],
});

const receipt = await publicClient.waitForTransactionReceipt({ hash });

const newMarketAddress = parseEventLogs({
  abi: marketFactoryAbi,
  eventName: "NewMarket",
  logs: receipt.logs,
})?.[0]?.args?.market;
if (!newMarketAddress) throw new Error("NewMarket event not found in receipt");
```

### 2. Create Multi Categorical market (viem)

```typescript
const params = createMarketParams({
  marketName: "Which teams will qualify? (select all that apply)",
  outcomes: ["Team A", "Team B", "Team C"],
  category: "sports",
  openingTime: Math.floor(Date.now() / 1000),
  minBond: 10000000000000000n,
  tokenNames: ["TEAM_A", "TEAM_B", "TEAM_C"],
});

const hash = await walletClient.writeContract({
  address: addresses.MarketFactory,
  abi: marketFactoryAbi,
  functionName: "createMultiCategoricalMarket",
  args: [params],
});
```

### 3. Create Scalar market (viem)

Scalar bounds must be in **wei** (1e18 units). Use `parseEther` from viem to convert human-readable numbers (e.g. 0 and 50 for a 0–50 °C range):

```typescript
import { parseEther } from "viem";

const params = createMarketParams({
  marketName: "What will be the temperature in °C on 2025-03-01?",
  outcomes: ["Lower", "Higher"], // two outcomes for scalar
  category: "weather",
  // Bounds in wei (1e18): parseEther("50") = 50 * 10^18
  lowerBound: parseEther("0"),
  upperBound: parseEther("50"),
  openingTime: Math.floor(Date.now() / 1000),
  minBond: 10000000000000000n,
  tokenNames: ["LOWER", "HIGHER"],
});

const hash = await walletClient.writeContract({
  address: addresses.MarketFactory,
  abi: marketFactoryAbi,
  functionName: "createScalarMarket",
  args: [params],
});
```

### 4. Create Multi Scalar market (viem)

Each outcome becomes part of a Reality question: `questionStart + outcomes[i] + questionEnd`. The market name is `questionStart + "[" + outcomeType + "]" + questionEnd`.

```typescript
const params = createMarketParams({
  marketName: "", // ignored; built from questionStart/outcomeType/questionEnd
  questionStart: "What will be the max temperature in °C on 2025-03-01 in ",
  questionEnd: "?",
  outcomeType: "City",
  outcomes: ["Berlin", "Madrid", "Paris"],
  category: "weather",
  openingTime: Math.floor(Date.now() / 1000),
  minBond: 10000000000000000n,
  tokenNames: ["BERLIN", "MADRID", "PARIS"],
});

const hash = await walletClient.writeContract({
  address: addresses.MarketFactory,
  abi: marketFactoryAbi,
  functionName: "createMultiScalarMarket",
  args: [params],
});
```

{% hint style="info" %}
For multi scalar markets, **marketName** is set to `questionStart + "[" + outcomeType + "]" + questionEnd`.
{% endhint %}
