# Conditional market

A **conditional market** is a market that depends on a specific outcome of an existing (**parent**) market. The child market’s positions are backed by the parent’s outcome token, not by the chain’s base collateral. For example: **“Will Russia withdraw all troops from Ukrainian territory by end of 2025?”** conditional on the parent **“Will the war in Ukraine end in 2024?”** resolving to **Yes** (outcome index 0).

You create conditional markets with the same <mark style="color:red;">`MarketFactory`</mark> functions as root markets (e.g. `createCategoricalMarket`), but you set <mark style="color:red;">`parentMarket`</mark> and <mark style="color:red;">`parentOutcome`</mark> in <mark style="color:red;">`CreateMarketParams`</mark>. Split, merge and redeem use the same <mark style="color:red;">`Router`</mark> (or chain-specific router) with the **parent’s outcome token** as the collateral token for the child market. Redeeming a resolved conditional market returns **parent outcome tokens**; to get base collateral in one go you can use <mark style="color:red;">`ConditionalRouter.redeemConditionalToCollateral`</mark> when the parent is a root market.

---

## Creating a conditional market

Use any of the four market-creation functions on the MarketFactory and pass a **parent market address** and **parent outcome index** in the params. The child market is tied to “parent resolves to this outcome.”

| Parameter       | Type    | Description |
|----------------|---------|-------------|
| `parentMarket` | address | Parent market contract address. Use `address(0)` for a root (non-conditional) market. |
| `parentOutcome`| uint256 | Index of the parent outcome this market is conditional on (e.g. `0` = Yes, `1` = No in a binary market). |

## Split, merge and redeem

The same <mark style="color:red;">`Router`</mark> (or <mark style="color:red;">`GnosisRouter`</mark> / <mark style="color:red;">`MainnetRouter`</mark>) is used. The important difference is the **collateral token**:

- **Root market**: collateral token = base collateral (e.g. sDAI on Gnosis, or the ERC20 you use on that chain).
- **Conditional market**: collateral token = **parent’s wrapped outcome token** (the ERC20 for the parent outcome at index `parentOutcome`).

So for a conditional market you do **not** use `splitFromBase` (Gnosis) or `splitFromDai` (Mainnet); you use `splitPosition(collateralToken, market, amount)` where `collateralToken` is the parent outcome ERC20.

### Split

You must hold enough **parent outcome tokens** (from splitting or trading the parent market). Then:

1. Approve the **parent’s wrapped outcome token** (for the outcome index the child is conditional on) to the Router.
2. Call `router.splitPosition(parentWrappedOutcomeToken, conditionalMarket, amount)`.

You receive a full set of **child** outcome tokens (one ERC20 per outcome).

### Merge

Hold a full set of **child** outcome tokens (equal amount of each outcome; e.g. 50 of outcome A and 50 of outcome B). Call:

`router.mergePositions(parentWrappedOutcomeToken, conditionalMarket, amount)`.

You receive **parent outcome tokens** back.

### Redeem (after child market is resolved)

Call `router.redeemPositions(parentWrappedOutcomeToken, conditionalMarket, outcomeIndexes, amounts)` with the **winning** child outcome index(es) and amounts. You receive **parent outcome tokens** (not base collateral). To get base collateral you must either:

- Redeem the parent market separately (if the parent is resolved), or  
- Use <mark style="color:red;">`ConditionalRouter.redeemConditionalToCollateral`</mark> (see below), which redeems child winning positions and then redeems the resulting parent outcome to collateral in one tx. The parent must be a **root** market (not conditional).

---

## ConditionalRouter: redeem to collateral in one call

<mark style="color:red;">`ConditionalRouter`</mark> extends Router and adds:

```solidity
function redeemConditionalToCollateral(
    IERC20 collateralToken,
    Market market,
    uint256[] calldata outcomeIndexes,
    uint256[] calldata parentOutcomeIndexes,
    uint256[] calldata amounts
) public
```

- **outcomeIndexes** / **amounts**: winning child outcome(s) to redeem.
- **parentOutcomeIndexes**: which parent outcome(s) to redeem when converting the received parent tokens to collateral (e.g. `[0]` if the parent resolved to outcome 0).

The parent market must be a **root** market (not conditional). The function redeems the child positions and then the parent outcome tokens, and sends **collateral** to the user.

---

## Nested conditional markets

The framework supports multiple levels: a market can be conditional on another conditional market. Interact with each level the same way (collateral token for a child is always the parent’s wrapped outcome token).

If the parent resolves to an outcome **different** from the one the child is conditional on, the child market (and any deeper nesting) becomes obsolete: no one can redeem that branch for value.

---

## Viem examples

We use the [Viem setup](1-viem-setup.md): `getPublicClient(chain)` and `getWalletClient(chain, process.env.PRIVATE_KEY)`. Addresses come from `SEER_CONTRACTS[chain.id]`. You also need the **MarketFactory** and **Router** (or GnosisRouter/MainnetRouter) ABIs, and a **parent market** already created. The parent can be root or conditional.

### 1. Create a conditional categorical market

Use the same `createMarketParams` helper and MarketFactory ABI as in [Create a market](2-create-market.md), and set `parentMarket` and `parentOutcome`:

```typescript
import { getPublicClient, getWalletClient, SEER_CONTRACTS } from "./viem-clients"; // or your module from 1-viem-setup.md
import { gnosis } from "viem/chains"; // or mainnet, base, etc.

const chain = gnosis;
const publicClient = getPublicClient(chain);
const walletClient = getWalletClient(chain, process.env.PRIVATE_KEY! as `0x${string}`);
const addresses = SEER_CONTRACTS[chain.id];
const parentMarketAddress = "0x..."; // parent market address
const parentOutcomeIndex = 0;       // e.g. 0 = Yes

const params = createMarketParams({
  marketName: "If the war ends in 2024, will Russia withdraw all troops by end of 2025?",
  outcomes: ["Yes", "No"],
  parentMarket: parentMarketAddress,
  parentOutcome: BigInt(parentOutcomeIndex),
  category: "misc",
  openingTime: Math.floor(Date.now() / 1000) + 86400 * 30,
  minBond: 10000000000000000n,
  tokenNames: ["YES", "NO"],
});

const hash = await walletClient.writeContract({
  address: addresses.MarketFactory,
  abi: marketFactoryAbi,
  functionName: "createCategoricalMarket",
  args: [params],
});
const receipt = await publicClient.waitForTransactionReceipt({ hash });
// Parse NewMarket event to get conditional market address
const conditionalMarketAddress = "0x..."; // from event
```

### 2. Get parent wrapped outcome token (for split/merge/redeem)

The “collateral” token for the **conditional** market in Router calls is the parent’s wrapped outcome ERC20. You can read it from the **child** market (if the contract exposes it) or from the parent:

```typescript
const marketAbi = [
  { inputs: [], name: "parentMarket", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "parentOutcome", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  {
    inputs: [{ name: "index", type: "uint256" }],
    name: "wrappedOutcome",
    outputs: [{ name: "wrapped1155", type: "address" }, { name: "data", type: "bytes" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const parentMarket = await publicClient.readContract({
  address: conditionalMarketAddress,
  abi: marketAbi,
  functionName: "parentMarket",
});
const parentOutcome = await publicClient.readContract({
  address: conditionalMarketAddress,
  abi: marketAbi,
  functionName: "parentOutcome",
});

const [parentWrappedOutcomeToken] = await publicClient.readContract({
  address: parentMarket,
  abi: marketAbi,
  functionName: "wrappedOutcome",
  args: [parentOutcome],
});
// parentWrappedOutcomeToken is the ERC20 to use as collateralToken in Router calls
```

### 3. Split on a conditional market

Approve the parent outcome token to the Router, then call `splitPosition` with that token and the **conditional** market. Use `addresses.Router` (Optimism/Base), `addresses.GnosisRouter` (Gnosis), or `addresses.MainnetRouter` (Ethereum) as appropriate for your chain.

```typescript
const routerAddress = addresses.Router ?? addresses.GnosisRouter ?? addresses.MainnetRouter;
const amount = 1000000000000000000n; // 1e18

const erc20Abi = [
  {
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    name: "approve",
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

await walletClient.writeContract({
  address: parentWrappedOutcomeToken,
  abi: erc20Abi,
  functionName: "approve",
  args: [routerAddress, amount],
});

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
] as const;

const hash = await walletClient.writeContract({
  address: routerAddress,
  abi: routerAbi,
  functionName: "splitPosition",
  args: [parentWrappedOutcomeToken, conditionalMarketAddress, amount],
});
```

### 4. Merge on a conditional market

You need a full set of child outcome tokens (equal amount of each outcome). Same Router and “collateral” token (parent wrapped outcome):

```typescript
const hash = await walletClient.writeContract({
  address: routerAddress,
  abi: routerAbi,
  functionName: "mergePositions",
  args: [parentWrappedOutcomeToken, conditionalMarketAddress, amount],
});
```

### 5. Redeem (child resolved) → parent outcome tokens

After the **child** market is resolved, redeem winning child outcome(s). You receive **parent** outcome tokens. Use a Router ABI that includes `redeemPositions(collateralToken, market, outcomeIndexes, amounts)` (see [Split, merge and redeem](4-split-merge-and-redeem.md)):

```typescript
const outcomeIndexes = [0n];   // e.g. first outcome won
const amounts = [500000000000000000n];

const hash = await walletClient.writeContract({
  address: routerAddress,
  abi: routerAbi, // must include redeemPositions
  functionName: "redeemPositions",
  args: [parentWrappedOutcomeToken, conditionalMarketAddress, outcomeIndexes, amounts],
});
```

### 6. Redeem to base collateral in one tx (ConditionalRouter)

If the **parent** is a root market and is already resolved, you can use ConditionalRouter to redeem child winning positions and get **collateral** in one call. Use `addresses.ConditionalRouter`.

```typescript
const collateralToken = "0x..."; // base collateral (e.g. sDAI on Gnosis)

const conditionalRouterAbi = [
  {
    inputs: [
      { name: "collateralToken", type: "address" },
      { name: "market", type: "address" },
      { name: "outcomeIndexes", type: "uint256[]" },
      { name: "parentOutcomeIndexes", type: "uint256[]" },
      { name: "amounts", type: "uint256[]" },
    ],
    name: "redeemConditionalToCollateral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const outcomeIndexes = [0n];
const parentOutcomeIndexes = [0n]; // parent outcome that won (e.g. Yes = 0)
const amounts = [500000000000000000n];

const hash = await walletClient.writeContract({
  address: addresses.ConditionalRouter,
  abi: conditionalRouterAbi,
  functionName: "redeemConditionalToCollateral",
  args: [
    collateralToken,
    conditionalMarketAddress,
    outcomeIndexes,
    parentOutcomeIndexes,
    amounts,
  ],
});
```

---

## Summary

| Step | What to use |
|------|-------------|
| **Create** | MarketFactory (e.g. `createCategoricalMarket`) with `parentMarket` and `parentOutcome` in params. |
| **Collateral token for Router** | Parent’s wrapped outcome token (read via parent’s `wrappedOutcome(parentOutcome)` or child’s parent info). |
| **Split** | Hold parent outcome tokens → approve parent wrapped token → `router.splitPosition(parentWrappedToken, conditionalMarket, amount)`. |
| **Merge** | Hold full set of child outcome tokens (equal amount of each) → `router.mergePositions(parentWrappedToken, conditionalMarket, amount)` → receive parent outcome tokens. |
| **Redeem** | After child resolved → `router.redeemPositions(...)` → receive parent outcome tokens; or use `ConditionalRouter.redeemConditionalToCollateral` to get base collateral in one tx (parent must be root and resolved). |

{% hint style="info" %}
On Gnosis/Mainnet, for conditional markets do **not** use `splitFromBase` / `splitFromDai`. Use the same router’s `splitPosition(parentWrappedOutcomeToken, conditionalMarket, amount)` after approving the parent outcome token.
{% endhint %}
