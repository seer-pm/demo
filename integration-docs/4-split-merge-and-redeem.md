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

## Viem examples

We use the [Viem setup](1-viem-setup.md): `getPublicClient(chain)` and `getWalletClient(chain, process.env.PRIVATE_KEY)`. Addresses come from `SEER_CONTRACTS[chain.id]` (Router on Optimism/Base, GnosisRouter on Gnosis, MainnetRouter on Ethereum). The user must have approved the collateral (or sent native xDAI for Gnosis) and the market must exist.

### Shared: addresses

```typescript
import { getPublicClient, getWalletClient, SEER_CONTRACTS } from "./viem-clients"; // or your module from 1-viem-setup.md
import { gnosis } from "viem/chains"; // or mainnet, base, etc.

const chain = gnosis;
const publicClient = getPublicClient(chain);
const walletClient = getWalletClient(chain, process.env.PRIVATE_KEY! as `0x${string}`);
const account = walletClient.account!;
const chainId = chain.id;
const addresses = SEER_CONTRACTS[chainId];
const marketAddress = "0x..."; // Market contract address (the market instance)
```

---

### 1. splitPosition / mergePositions / redeemPositions (any router)

The functions `splitPosition`, `mergePositions`, and `redeemPositions` exist on the base **Router** and are also available on **GnosisRouter** and **MainnetRouter** (they extend Router). Use the router address for your chain (`addresses.Router`, `addresses.GnosisRouter`, or `addresses.MainnetRouter`) and pass the **collateral token** address (e.g. USDC, or the parent outcome token for conditional markets) and the **market** address.

```typescript
const COLLATERAL_TOKEN = "0x..."; // ERC20 collateral (e.g. USDC)
const routerAddress = addresses.Router ?? addresses.GnosisRouter ?? addresses.MainnetRouter; // router for current chain

const routerAbi = [
  {
    inputs: [
      { name: "collateralToken", type: "address" },
      { name: "market", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "splitPosition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "collateralToken", type: "address" },
      { name: "market", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "mergePositions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "collateralToken", type: "address" },
      { name: "market", type: "address" },
      { name: "outcomeIndexes", type: "uint256[]" },
      { name: "amounts", type: "uint256[]" },
    ],
    name: "redeemPositions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
```

**Split:**

```typescript
const amount = 1000000n; // 1e6 units of collateral (e.g. 1 USDC if 6 decimals)

const hash = await walletClient.writeContract({
  address: routerAddress,
  abi: routerAbi,
  functionName: "splitPosition",
  args: [COLLATERAL_TOKEN, marketAddress, amount],
});
const receipt = await publicClient.waitForTransactionReceipt({ hash });
```

**Merge:**

```typescript
const amount = 1000000n; // equal amount per outcome (same value for each)

const hash = await walletClient.writeContract({
  address: routerAddress,
  abi: routerAbi,
  functionName: "mergePositions",
  args: [COLLATERAL_TOKEN, marketAddress, amount],
});
```

**Redeem** (after market is resolved):

```typescript
const outcomeIndexes = [0n];   // e.g. first outcome won
const amounts = [500000n];     // amount of that outcome to redeem

const hash = await walletClient.writeContract({
  address: routerAddress,
  abi: routerAbi,
  functionName: "redeemPositions",
  args: [COLLATERAL_TOKEN, marketAddress, outcomeIndexes, amounts],
});
```

---

### 2. GnosisRouter (Gnosis Chain)

**GnosisRouter** implements helpers so you can work with **xDAI** directly instead of sDAI: you send native xDAI with `splitFromBase`, and `mergeToBase` / `redeemToBase` return xDAI. The router converts to/from **sDAI** internally (sDAI is the collateral used by the market). Use `addresses.GnosisRouter` (chain 100) when you prefer xDAI.

```typescript
const gnosisRouterAbi = [
  {
    inputs: [{ name: "market", type: "address" }],
    name: "splitFromBase",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { name: "market", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "mergeToBase",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "market", type: "address" },
      { name: "outcomeIndexes", type: "uint256[]" },
      { name: "amounts", type: "uint256[]" },
    ],
    name: "redeemToBase",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
```

**Split** (send xDAI; router converts to sDAI internally):

```typescript
import { parseEther } from "viem";

const value = parseEther("1"); // 1 xDAI

const hash = await walletClient.writeContract({
  address: addresses.GnosisRouter,
  abi: gnosisRouterAbi,
  functionName: "splitFromBase",
  args: [marketAddress],
  value,
});
```

**Merge:**

```typescript
const amount = 1000000000000000000n; // 1e18 (per-outcome amount; router redeems sDAI to xDAI)

const hash = await walletClient.writeContract({
  address: addresses.GnosisRouter,
  abi: gnosisRouterAbi,
  functionName: "mergeToBase",
  args: [marketAddress, amount],
});
```

**Redeem:**

```typescript
const outcomeIndexes = [0n];
const amounts = [500000000000000000n];

const hash = await walletClient.writeContract({
  address: addresses.GnosisRouter,
  abi: gnosisRouterAbi,
  functionName: "redeemToBase",
  args: [marketAddress, outcomeIndexes, amounts],
});
```

---

### 3. MainnetRouter (Ethereum mainnet)

**MainnetRouter** implements helpers so you can work with **DAI** directly instead of sDAI: you approve DAI for `splitFromDai`, and `mergeToDai` / `redeemToDai` return DAI. The router converts to/from **sDAI** internally. Use `addresses.MainnetRouter` (chain 1) when you prefer DAI.

```typescript
const mainnetRouterAbi = [
  {
    inputs: [
      { name: "market", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "splitFromDai",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "market", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "mergeToDai",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "market", type: "address" },
      { name: "outcomeIndexes", type: "uint256[]" },
      { name: "amounts", type: "uint256[]" },
    ],
    name: "redeemToDai",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
```

**Split** (approve DAI; router converts to sDAI internally):

```typescript
const daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F" as const;
const amount = parseEther("100"); // 100 DAI

// 1. Approve DAI to MainnetRouter (it will convert to sDAI for the split)
await walletClient.writeContract({
  address: daiAddress,
  abi: [
    {
      inputs: [
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
  functionName: "approve",
  args: [addresses.MainnetRouter, amount],
});

// 2. Split
const hash = await walletClient.writeContract({
  address: addresses.MainnetRouter,
  abi: mainnetRouterAbi,
  functionName: "splitFromDai",
  args: [marketAddress, amount],
});
```

**Merge / Redeem:** same pattern as GnosisRouter but with `mergeToDai` and `redeemToDai` (router converts sDAI back to DAI).

---

### Simulate before sending

To avoid reverts (e.g. insufficient allowance or balance), simulate first:

```typescript
// Use the router for your chain (Router, GnosisRouter, or MainnetRouter — all support splitPosition/merge/redeem)
const routerAddress = addresses.Router ?? addresses.GnosisRouter ?? addresses.MainnetRouter;
const { request } = await publicClient.simulateContract({
  account: account.address,
  address: routerAddress,
  abi: routerAbi,
  functionName: "splitPosition",
  args: [COLLATERAL_TOKEN, marketAddress, amount],
});
const hash = await walletClient.writeContract(request);
```

For GnosisRouter `splitFromBase`, include `value` in `simulateContract` if your client supports it for payable calls.

---

## Summary

| Action | Router (generic) | GnosisRouter | MainnetRouter |
|--------|-------------------|--------------|---------------|
| **Split** | Approve collateral → `splitPosition(collateral, market, amount)` | Send xDAI → `splitFromBase(market)` (router → sDAI) | Approve DAI → `splitFromDai(market, amount)` (router → sDAI) |
| **Merge** | Hold one set of outcomes → `mergePositions(collateral, market, amount)` | `mergeToBase(market, amount)` → receive xDAI (router redeems sDAI) | `mergeToDai(market, amount)` → receive DAI (router redeems sDAI) |
| **Redeem** | After resolve → `redeemPositions(collateral, market, outcomeIndexes, amounts)` | `redeemToBase(...)` → xDAI | `redeemToDai(...)` → DAI |

{% hint style="info" %}
For **conditional markets**, use the same Router functions with the **child** market; the Router uses the parent’s outcome token as “collateral” for that market. Redeem returns parent outcome tokens until you redeem at the root market for base collateral.
{% endhint %}
