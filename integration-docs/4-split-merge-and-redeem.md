# Split, Merge and Redeem

Use the **Router** (or chain-specific **GnosisRouter** / **MainnetRouter**) to **split** collateral into outcome tokens, **merge** a full set of outcome tokens back into collateral, and **redeem** winning outcome tokens after resolution. The market must already exist (see [Create a market](2-create-market.md)).

**Which router and collateral:**

GnosisRouter and MainnetRouter **inherit from Router**, so they expose the same functions (`splitPosition`, `mergePositions`, `redeemPositions`, `getWinningOutcomes`). You can call those with any collateral token on any chain.

- **Router (all networks):** Pass an ERC20 **collateral token** and the market address; approve the collateral and call `splitPosition` / `mergePositions` / `redeemPositions`. Use the router address for your chain (`addresses.Router`, `addresses.GnosisRouter`, or `addresses.MainnetRouter` — all support these calls).
- **Gnosis (100):** **GnosisRouter** also exposes `splitFromBase(market)` (payable in xDAI), `mergeToBase`, and `redeemToBase`: you work with **xDAI** directly; the router converts to/from **sDAI** internally (sDAI is the collateral used by the market). Convenient if you prefer xDAI over sDAI.
- **Ethereum (1):** **MainnetRouter** also exposes `splitFromDai(market, amount)`, `mergeToDai`, and `redeemToDai`: you work with **DAI** directly; the router converts to/from **sDAI** internally. Convenient if you prefer DAI over sDAI.

---

## Router functions overview

| Contract | Chain | Collateral | Split | Merge | Redeem |
|----------|-------|------------|--------|--------|--------|
| **Router** | All | Any ERC20 you pass | `splitPosition(collateral, market, amount)` | `mergePositions(collateral, market, amount)` | `redeemPositions(collateral, market, outcomeIndexes, amounts)` |
| **GnosisRouter** | Gnosis | Same as Router, or xDAI via `splitFromBase` / `mergeToBase` / `redeemToBase` (router converts xDAI ↔ sDAI) | `splitPosition(...)` or `splitFromBase(market)` payable | `mergePositions(...)` or `mergeToBase(market, amount)` | `redeemPositions(...)` or `redeemToBase(market, outcomeIndexes, amounts)` |
| **MainnetRouter** | Ethereum | Same as Router, or DAI via `splitFromDai` / `mergeToDai` / `redeemToDai` (router converts DAI ↔ sDAI) | `splitPosition(...)` or `splitFromDai(market, amount)` | `mergePositions(...)` or `mergeToDai(market, amount)` | `redeemPositions(...)` or `redeemToDai(market, outcomeIndexes, amounts)` |

---

## Split

**What you do:** Provide collateral (or send xDAI on Gnosis) and receive one **full set** of outcome tokens (one ERC20 per outcome).

| Router | Parameters | What you need before calling |
|--------|-------------|------------------------------|
| **Router** | `splitPosition(collateralToken, market, amount)` | Approve `amount` of `collateralToken` to the Router. |
| **GnosisRouter** | `splitFromBase(market)` + send `value` (xDAI) | Send the desired xDAI amount as `value` in the tx. |
| **MainnetRouter** | `splitFromDai(market, amount)` | Approve `amount` of DAI to MainnetRouter. |

**Parameters:** `collateralToken` (Router only): ERC20 address. `market`: Market contract address. `amount`: amount in collateral units; you receive that many units of **each** outcome token.

---

## Merge

**What you do:** Hold a **full set** of outcome tokens (same amount of each outcome), then merge them back into collateral. You receive collateral (or parent outcome tokens for conditional markets).

| Router | Parameters |
|--------|-------------|
| **Router** | `mergePositions(collateralToken, market, amount)` |
| **GnosisRouter** | `mergeToBase(market, amount)` |
| **MainnetRouter** | `mergeToDai(market, amount)` |

**Parameters:** `market`, and `amount` (per-outcome amount you are merging). Approve the Router to spend that amount of **each** outcome token.

---

## Redeem

| Router | Parameters |
|--------|-------------|
| **Router** | `redeemPositions(collateralToken, market, outcomeIndexes, amounts)` |
| **GnosisRouter** | `redeemToBase(market, outcomeIndexes, amounts)` |
| **MainnetRouter** | `redeemToDai(market, outcomeIndexes, amounts)` |

**What you do:** After the market is **resolved**, redeem **winning** outcome tokens for collateral (or parent outcome tokens in conditional markets).

**Parameters:** `outcomeIndexes`: array of outcome indices that **won** (e.g. `[0]` or `[1, 2]`). `amounts`: amount to redeem for each (same length). Approve the Router to spend the winning outcome token(s) before calling.

**How to know which outcomes won:** Call the view `getWinningOutcomes(conditionId)` on the **Router** (or GnosisRouter / MainnetRouter on those chains) with the market's `conditionId`; the returned array has `true` for each winning outcome index.

**ABI and example (viem):**

```typescript
const getWinningOutcomesAbi = [
  {
    inputs: [{ name: "conditionId", type: "bytes32" }],
    name: "getWinningOutcomes",
    outputs: [{ name: "", type: "bool[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// conditionId from market.conditionId(); routerAddress = Router, GnosisRouter, or MainnetRouter per chain
const winningOutcomes = await publicClient.readContract({
  address: routerAddress,
  abi: getWinningOutcomesAbi,
  functionName: "getWinningOutcomes",
  args: [conditionId],
});
// winningOutcomes[i] === true means outcome index i is winning and can be redeemed
```

---

## Conditional markets

For **conditional** (child) markets, the “collateral” for that market is a **parent outcome token** (ERC20 from a parent market), not the chain’s base collateral.

- **Split**: user holds parent outcome tokens; splitting mints child outcome tokens (one set per `amount`).
- **Merge**: user holds a full set of child outcome tokens (equal amount of each outcome); merging returns parent outcome tokens.
- **Redeem**: after the child market is resolved, user redeems winning child outcome tokens for **parent outcome tokens** (not base collateral until the parent is also resolved and redeemed).

Use the same Router functions with the **child** market; pass the parent's wrapped outcome token as the collateral token for split/merge/redeem (see [Conditional market](5-conditional-market.md)).

---

## Using @seer-pm/sdk (recommended)

The **@seer-pm/sdk** provides `getRouterAddress`, `getSplitExecution`, `getMergeExecution`, and `getRedeemExecution`. Approve the collateral (or outcome tokens) before sending. See [Viem setup](1-viem-setup.md#dependencies) for installation.

### SDK: shared setup and split

```typescript
import { getPublicClient, getWalletClient, ERC20_APPROVE_ABI } from "./viem-setup";
import { gnosis } from "viem/chains";
import {
  getRouterAddress,
  getSplitExecution,
  COLLATERAL_TOKENS,
} from "@seer-pm/sdk";

const chain = gnosis;
const publicClient = getPublicClient(chain);
const walletClient = getWalletClient(chain, process.env.PRIVATE_KEY! as `0x${string}`);
const chainId = chain.id;

const marketAddress = "0x..."; // Market contract address

const market = { id: marketAddress, type: "Generic" as const, chainId };
const router = getRouterAddress(market);
const collateralToken = COLLATERAL_TOKENS[chainId]?.primary?.address; // or undefined for Gnosis (splitFromBase) / Mainnet (splitFromDai)

const amount = 1000000000000000000n; // 1e18

if (collateralToken) {
  await walletClient.writeContract({
    address: collateralToken,
    abi: ERC20_APPROVE_ABI,
    functionName: "approve",
    args: [router, amount],
  });
}

const splitExecution = getSplitExecution({ router, market, collateralToken, amount });

const hash = await walletClient.sendTransaction(splitExecution);
await publicClient.waitForTransactionReceipt({ hash });
```

- On **Gnosis**, `COLLATERAL_TOKENS[chainId].primary` is sDAI; if you pass `collateralToken: undefined`, the SDK builds a **splitFromBase** (payable xDAI) tx — send the same `amount` as `value` when calling `sendTransaction`.
- On **Ethereum**, `collateralToken: undefined` yields **splitFromDai**; approve DAI to the router and the SDK encodes `splitFromDai(market, amount)`.

### SDK: merge

```typescript
import { getMergeExecution, getRouterAddress, COLLATERAL_TOKENS } from "@seer-pm/sdk";

// Approve router to spend `amount` of each outcome token (see "Merge" below for the loop over wrappedOutcome(i)).
const mergeExecution = getMergeExecution({ router, market, collateralToken, amount });

const hash = await walletClient.sendTransaction(mergeExecution);
```

### SDK: redeem (after market is resolved)

```typescript
import { getRedeemExecution, getRouterAddress, COLLATERAL_TOKENS } from "@seer-pm/sdk";

const outcomeIndexes = [0n];
const amounts = [500000000000000000n];
const isRedeemToParentCollateral = false; // true for conditional → base in one call via ConditionalRouter

// Approve router to spend each winning outcome token (see "Redeem" below).
const redeemExecution = getRedeemExecution({
  market,
  collateralToken,
  parentOutcome: 0n,
  outcomeIndexes,
  amounts,
  isRedeemToParentCollateral,
});

const hash = await walletClient.sendTransaction(redeemExecution);
```

For **conditional markets**, use the same functions with the child market and pass the parent's outcome token as `collateralToken`; for redeeming to base collateral in one tx use `isRedeemToParentCollateral: true` (ConditionalRouter).

---
