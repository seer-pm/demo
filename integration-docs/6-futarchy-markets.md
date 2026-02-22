# Futarchy market

In **futarchy markets**, participants trade on how a specific decision (e.g. a DAO proposal) will affect the price of two tokens. The market asks a single yes/no question (e.g. *“Will proposal GIP-120 be accepted by February 1 2025?”*). There are **four outcome tokens**: Yes/Token1, No/Token1, Yes/Token2, No/Token2. After resolution, either the two “Yes” outcomes or the two “No” outcomes are redeemable for the two collateral tokens.

Creation uses <mark style="color:red;">`FutarchyFactory.createProposal`</mark>. Split, merge and redeem use <mark style="color:red;">`FutarchyRouter`</mark>, which is like the standard Router but works with **two collateral tokens** and a <mark style="color:red;">`FutarchyProposal`</mark> (proposal address) instead of a Market. Resolution uses <mark style="color:red;">`FutarchyRealityProxy.resolve(proposal)`</mark> (or <mark style="color:red;">`proposal.resolve()`</mark>).

---

## Create a futarchy proposal

Call <mark style="color:red;">`FutarchyFactory.createProposal`</mark> with a <mark style="color:red;">`CreateProposalParams`</mark> struct. Outcomes and token names are derived from the two collateral token symbols (e.g. Yes-GNO, No-GNO, Yes-wstETH, No-wstETH).

```solidity
struct CreateProposalParams {
    string marketName;
    IERC20 collateralToken1;
    IERC20 collateralToken2;
    string category;
    string lang;
    uint256 minBond;
    uint32 openingTime;
}
```

- **marketName**: The Reality.eth question (e.g. “Will proposal X be accepted by date Y?”).
- **collateralToken1** / **collateralToken2**: The two ERC20 tokens used as collateral (e.g. GNO and wstETH).
- **category** / **lang**: Reality question category and language.
- **minBond**: Minimum bond for answering on Reality.eth.
- **openingTime**: Unix timestamp when the question can be answered.

On success, the factory returns the new **proposal contract address** (you can also read it from the `NewProposal` event).

---

## Split, merge and redeem

Use <mark style="color:red;">`FutarchyRouter`</mark> for all three. The **argument order** differs from the standard Router: the **proposal** (FutarchyProposal address) comes first, then the collateral token, then the amount.

### Split

You choose **one** of the two collateral tokens and split that token into the two outcome tokens for that collateral (Yes-Token and No-Token). So one split gives you only the pair for token1 **or** the pair for token2. To get all four outcome tokens you split twice (once per collateral).

```solidity
function splitPosition(FutarchyProposal proposal, IERC20 collateralToken, uint256 amount) public
```

1. Approve **collateralToken** (token1 or token2) to the FutarchyRouter.
2. Call `futarchyRouter.splitPosition(proposal, collateralToken, amount)`.
3. You receive the two ERC20 outcome tokens for that collateral (e.g. Yes-GNO and No-GNO).

### Merge

Hold **one full set** of outcome tokens for **one** collateral (i.e. equal amounts of Yes-Token and No-Token for that collateral). Merge returns that collateral to you.

```solidity
function mergePositions(FutarchyProposal proposal, IERC20 collateralToken, uint256 amount) public
```

Approve both outcome tokens (for that collateral) to the router, then call `mergePositions(proposal, collateralToken, amount)`. You receive **collateralToken** back.

### Redeem (after resolution)

After the proposal is resolved (FutarchyRealityProxy has reported payouts), only the winning side (Yes or No) is redeemable. You can redeem per collateral or both in one call.

**Option A – Redeem one collateral**

```solidity
function redeemPositions(FutarchyProposal proposal, IERC20 collateralToken, uint256 amount) public
```

Approve the **winning** outcome token for one collateral (e.g. Yes-GNO if the proposal was accepted). Call `redeemPositions(proposal, collateralToken, amount)`. You receive **collateralToken**.

**Option B – Redeem both collaterals in one tx**

```solidity
function redeemProposal(FutarchyProposal proposal, uint256 amount1, uint256 amount2) external
```

Approve the winning outcome tokens for **both** collaterals (e.g. Yes-GNO and Yes-wstETH). Call `redeemProposal(proposal, amount1, amount2)`. You receive **collateralToken1** and **collateralToken2** (amount1 and amount2 of each).

---

## Resolve a futarchy proposal

Same idea as [Resolve a market](3-resolve-market.md): the question must be answered and finalized on Reality.eth. Then call either:

- `FutarchyRealityProxy.resolve(proposal)`, or  
- `proposal.resolve()` (the proposal forwards to the reality proxy).

After resolution, YES (outcome 0) or NO (outcome 1) is the winning side; only the corresponding outcome tokens are redeemable.

---

## Viem examples

We use the [Viem setup](1-viem-setup.md): `getPublicClient(chain)` and `getWalletClient(chain, process.env.PRIVATE_KEY)`. Addresses come from `SEER_CONTRACTS[chain.id]`. Futarchy contracts are deployed on **Gnosis** (chain 100); on that chain use `addresses.FutarchyFactory` and `addresses.FutarchyRouter`.

### Shared: addresses

```typescript
import { getPublicClient, getWalletClient, SEER_CONTRACTS, ERC20_APPROVE_ABI, MARKET_ABI } from "./viem-setup";
import { gnosis } from "viem/chains"; // or mainnet, base, etc.

const chain = gnosis;
const publicClient = getPublicClient(chain);
const walletClient = getWalletClient(chain, process.env.PRIVATE_KEY! as `0x${string}`);
const account = walletClient.account!;
const addresses = SEER_CONTRACTS[chain.id];
```

---

### 1. Create a futarchy proposal

Build the params tuple and call `createProposal`. The factory derives outcomes and token names from the collateral symbols.

```typescript
import { parseEventLogs } from "viem/utils";

const GNO_ADDRESS = "0x...";   // collateral 1
const wstETH_ADDRESS = "0x..."; // collateral 2

const futarchyFactoryAbi = [
  {
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "marketName", type: "string" },
          { name: "collateralToken1", type: "address" },
          { name: "collateralToken2", type: "address" },
          { name: "category", type: "string" },
          { name: "lang", type: "string" },
          { name: "minBond", type: "uint256" },
          { name: "openingTime", type: "uint32" },
        ],
      },
    ],
    name: "createProposal",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    type: "event",
    name: "NewProposal",
    inputs: [
      { name: "proposal", type: "address", indexed: true },
      { name: "marketName", type: "string", indexed: false },
      { name: "conditionId", type: "bytes32", indexed: false },
      { name: "questionId", type: "bytes32", indexed: false },
    ],
  },
] as const;

const params = {
  marketName: "Will proposal GIP-120 be accepted by February 1 2025, 00:00 UTC?",
  collateralToken1: GNO_ADDRESS,
  collateralToken2: wstETH_ADDRESS,
  category: "misc",
  lang: "en_US",
  minBond: 1000000000000000000n, // 1e18
  openingTime: Math.floor(new Date("2025-02-01").getTime() / 1000),
};

const hash = await walletClient.writeContract({
  address: addresses.FutarchyFactory,
  abi: futarchyFactoryAbi,
  functionName: "createProposal",
  args: [params],
});
const receipt = await publicClient.waitForTransactionReceipt({ hash });

const parsedLogs = parseEventLogs({
  abi: futarchyFactoryAbi,
  eventName: "NewProposal",
  logs: receipt.logs,
});
const proposalAddress = parsedLogs[0]?.args?.proposal;
if (!proposalAddress) throw new Error("NewProposal event not found in receipt");
```

---

### 2. Split (one collateral)

Choose one of the two collateral tokens, approve it, then call `splitPosition(proposal, collateralToken, amount)`. Argument order: **proposal first**, then collateral, then amount.

```typescript
const amount = 1000000000000000000n; // 1e18

await walletClient.writeContract({
  address: GNO_ADDRESS,
  abi: ERC20_APPROVE_ABI,
  functionName: "approve",
  args: [addresses.FutarchyRouter, amount],
});

const futarchyRouterAbi = [
  {
    inputs: [
      { name: "proposal", type: "address" },
      { name: "collateralToken", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "splitPosition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "proposal", type: "address" },
      { name: "collateralToken", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "mergePositions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "proposal", type: "address" },
      { name: "collateralToken", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "redeemPositions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "proposal", type: "address" },
      { name: "amount1", type: "uint256" },
      { name: "amount2", type: "uint256" },
    ],
    name: "redeemProposal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const hash = await walletClient.writeContract({
  address: addresses.FutarchyRouter,
  abi: futarchyRouterAbi,
  functionName: "splitPosition",
  args: [proposalAddress, GNO_ADDRESS, amount],
});
```

To get outcome tokens for the second collateral as well, repeat with `wstETH_ADDRESS` (and approve wstETH to the router).

---

### 3. Merge (one collateral)

Hold equal amounts of Yes-Token and No-Token for **one** collateral. **Approve both outcome tokens** (Yes and No for that collateral) to the FutarchyRouter, then call `mergePositions(proposal, collateralToken, amount)`.

```typescript
// 1. Approve FutarchyRouter to spend `amount` of each outcome token. Get addresses via proposal.wrappedOutcome(0) and wrappedOutcome(1) (Yes/No).
const [yesToken] = await publicClient.readContract({
  address: proposalAddress,
  abi: MARKET_ABI,
  functionName: "wrappedOutcome",
  args: [0n],
});
const [noToken] = await publicClient.readContract({
  address: proposalAddress,
  abi: MARKET_ABI,
  functionName: "wrappedOutcome",
  args: [1n],
});
await walletClient.writeContract({
  address: yesToken,
  abi: ERC20_APPROVE_ABI,
  functionName: "approve",
  args: [addresses.FutarchyRouter, amount],
});
await walletClient.writeContract({
  address: noToken,
  abi: ERC20_APPROVE_ABI,
  functionName: "approve",
  args: [addresses.FutarchyRouter, amount],
});

// 2. Merge
const hash = await walletClient.writeContract({
  address: addresses.FutarchyRouter,
  abi: futarchyRouterAbi,
  functionName: "mergePositions",
  args: [proposalAddress, GNO_ADDRESS, amount],
});
```

---

### 4. Redeem – one collateral (`redeemPositions`)

After the proposal is resolved, approve the **winning** outcome token (e.g. Yes-GNO if accepted) to the FutarchyRouter. Then call `redeemPositions(proposal, collateralToken, amount)` to receive that collateral.

```typescript
// Winning outcome token (e.g. Yes-GNO) – get from proposal.wrappedOutcome(0) or (1) depending on resolution
const winningOutcomeToken = "0x...";

await walletClient.writeContract({
  address: winningOutcomeToken,
  abi: ERC20_APPROVE_ABI,
  functionName: "approve",
  args: [addresses.FutarchyRouter, amount],
});

const hash = await walletClient.writeContract({
  address: addresses.FutarchyRouter,
  abi: futarchyRouterAbi,
  functionName: "redeemPositions",
  args: [proposalAddress, GNO_ADDRESS, amount],
});
```

---

### 5. Redeem – both collaterals (`redeemProposal`)

Approve the winning outcome tokens for **both** collaterals. Then call `redeemProposal(proposal, amount1, amount2)` to receive both collateral tokens in one tx.

```typescript
const amount1 = 1000000000000000000n; // GNO to receive
const amount2 = 1000000000000000000n; // wstETH to receive

// Resolve outcome token addresses: wrappedOutcome(0)=Yes-token1, (1)=No-token1, (2)=Yes-token2, (3)=No-token2
const [yesGnoOutcomeAddress] = await publicClient.readContract({
  address: proposalAddress,
  abi: MARKET_ABI,
  functionName: "wrappedOutcome",
  args: [0n],
});
const [yesWstEthOutcomeAddress] = await publicClient.readContract({
  address: proposalAddress,
  abi: MARKET_ABI,
  functionName: "wrappedOutcome",
  args: [2n],
});

// Approve winning Yes outcome tokens for token1 and token2 (e.g. Yes-GNO and Yes-wstETH if proposal was accepted)
await walletClient.writeContract({
  address: yesGnoOutcomeAddress,
  abi: ERC20_APPROVE_ABI,
  functionName: "approve",
  args: [addresses.FutarchyRouter, amount1],
});
await walletClient.writeContract({
  address: yesWstEthOutcomeAddress,
  abi: ERC20_APPROVE_ABI,
  functionName: "approve",
  args: [addresses.FutarchyRouter, amount2],
});

const hash = await walletClient.writeContract({
  address: addresses.FutarchyRouter,
  abi: futarchyRouterAbi,
  functionName: "redeemProposal",
  args: [proposalAddress, amount1, amount2],
});
```

---

### 6. Resolve the proposal

Once the Reality.eth question is answered and finalized, call `proposal.resolve()` (or `FutarchyRealityProxy.resolve(proposal)`).

```typescript
const proposalAbi = [
  {
    inputs: [],
    name: "resolve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const hash = await walletClient.writeContract({
  address: proposalAddress,
  abi: proposalAbi,
  functionName: "resolve",
  args: [],
});
```

---

### 7. Simulate before sending

To avoid reverts (e.g. insufficient allowance or balance):

```typescript
const { request } = await publicClient.simulateContract({
  account: account.address,
  address: addresses.FutarchyRouter,
  abi: futarchyRouterAbi,
  functionName: "splitPosition",
  args: [proposalAddress, GNO_ADDRESS, amount],
});
const hash = await walletClient.writeContract(request);
```

---

## Summary

| Action | Contract | Function | Notes |
|--------|----------|----------|--------|
| **Create** | FutarchyFactory | `createProposal(params)` | params: marketName, collateralToken1, collateralToken2, category, lang, minBond, openingTime |
| **Split** | FutarchyRouter | `splitPosition(proposal, collateralToken, amount)` | Approve collateral first; do once per collateral to get all four outcome tokens |
| **Merge** | FutarchyRouter | `mergePositions(proposal, collateralToken, amount)` | Need equal amounts of Yes + No for that collateral |
| **Redeem (one collateral)** | FutarchyRouter | `redeemPositions(proposal, collateralToken, amount)` | Approve winning outcome token; after resolve |
| **Redeem (both)** | FutarchyRouter | `redeemProposal(proposal, amount1, amount2)` | Approve both winning outcome tokens |
| **Resolve** | FutarchyProposal | `resolve()` | Or FutarchyRealityProxy.resolve(proposal); question must be settled on Reality |

{% hint style="info" %}
**Argument order**: FutarchyRouter uses **(proposal, collateralToken, amount)**. The standard Router uses (collateralToken, market, amount). Don’t mix them up.
{% endhint %}
