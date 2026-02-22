# Trading outcome tokens

Outcome tokens (CTF positions) are traded on AMMs. Pools are always **outcome token / main collateral** for the chain.

- **Gnosis**: [Swapr](https://v3.swapr.eth.limo/) (Algebra V3).
- **Other chains** (Ethereum, Base, Optimism): [Uniswap V3](https://app.uniswap.org/).

Swapr (Algebra V3) and Uniswap V3 use the same swap interface, so you can use the **same router ABI** for both: `exactInputSingle` and `exactOutputSingle`.

**Note:** The code in this guide is provided as an example (direct router calls with viem). You can also use the **official Uniswap** or **Swapr** SDK in your project and call them directly to build and send swaps; the logic for routes, amounts, and slippage is the same.

---

## Main collateral by chain

Pools are quoted against the main collateral. Use these token addresses when building swap paths:

| Chain     | Main collateral | Address |
|----------|------------------|--------|
| Gnosis (100)   | sDAI  | `0xaf204776c7245bf4147c2612bf6e5972ee483701` |
| Ethereum (1)   | DAI   | `0x6B175474E89094C44Da98b954EedeAC495271d0F` |
| Base (8453)    | sUSDS | `0x5875eee11cf8398102fdad704c9e96607675467a` |
| Optimism (10)  | sUSDS | `0xb5b2dc7fd34c249f4be7fb1fcea07950784229e0` |

See also `COLLATERAL_TOKENS` / `TOKENS_BY_CHAIN` in the app’s [config](../../web/src/lib/config.ts).

---

## Router addresses

| Chain     | DEX     | Swap router address |
|----------|---------|----------------------|
| Gnosis   | Swapr   | `0xffb643e73f280b97809a8b41f7232ab401a04ee1` |
| Ethereum | Uniswap V3 | `0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45` |
| Base     | Uniswap V3 | `0x2626664c2603336E57B271c5C0b26F421741e481` |
| Optimism | Uniswap V3 | `0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45` |

Use the same router ABI (Uniswap V3–compatible) for Swapr and Uniswap V3.

---

## Router ABI (shared)

Use the Uniswap V3 `SwapRouter` ABI. Relevant functions:

- **`exactInputSingle(ExactInputSingleParams)`** – swap an exact amount of token-in for a minimum amount of token-out (e.g. spend X collateral, get at least Y outcome tokens).
- **`exactOutputSingle(ExactOutputSingleParams)`** – swap to receive an exact amount of token-out, with a maximum amount of token-in (e.g. get exactly Y outcome tokens, spend at most X collateral).

Params (same for both DEXs):

```solidity
struct ExactInputSingleParams {
    address tokenIn;
    address tokenOut;
    uint24 fee;           // pool fee tier (e.g. 3000 = 0.3%)
    address recipient;
    uint256 amountIn;     // exact amount in (for exactInputSingle)
    uint256 amountOutMinimum;  // minimum amount out (slippage)
    uint160 sqrtPriceLimitX96; // 0 = no limit
}

struct ExactOutputSingleParams {
    address tokenIn;
    address tokenOut;
    uint24 fee;
    address recipient;
    uint256 amountOut;    // exact amount out (for exactOutputSingle)
    uint256 amountInMaximum;  // maximum amount in (slippage)
    uint160 sqrtPriceLimitX96; // 0 = no limit
}
```

You need the **fee tier** of the pool (e.g. from the factory or subgraph). Common values: `500` (0.05%), `3000` (0.3%), `10000` (1%). Use `sqrtPriceLimitX96 = 0` for no price limit.

---

## Quoters (get a quote before trading)

To show the user how much they will receive or spend, call a **Quoter** contract before sending the swap. Quoters expose `quoteExactInputSingle` (exact amount in → minimum out) and `quoteExactOutputSingle` (exact amount out → maximum in). They are intended to be used off-chain via `eth_call`: the contract **reverts** with the result instead of returning it, so you must call and then decode the revert data.

### Quoter addresses

| Chain     | DEX     | Quoter address |
|----------|---------|----------------|
| Gnosis (100) | Swapr   | `0xcBaD9FDf0D2814659Eb26f600EFDeAF005Eda0F7` |
| Ethereum (1)  | Uniswap V3 | `0x61fFE014bA17989E743c5F6cB21bF9697530B21e` (QuoterV2) |
| Base (8453)   | Uniswap V3 | `0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a` (QuoterV2) |
| Optimism (10) | Uniswap V3 | `0x61fFE014bA17989E743c5F6cB21bF9697530B21e` (QuoterV2) |

**Swapr (Gnosis)** uses a different interface: no `fee` argument; the functions return `(amount, fee)` so you get the pool fee from the quote. **Uniswap V3** takes `fee` as a parameter and returns only the amount.

### Swapr Quoter (Gnosis) — Algebra V3

On Gnosis, the Swapr Quoter at `0xcBaD9FDf0D2814659Eb26f600EFDeAF005Eda0F7` uses:

```solidity
function quoteExactInputSingle(
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint160 limitSqrtPrice
) public returns (uint256 amountOut, uint16 fee);

function quoteExactOutputSingle(
    address tokenIn,
    address tokenOut,
    uint256 amountOut,
    uint160 limitSqrtPrice
) public returns (uint256 amountIn, uint16 fee);
```

- There is **no `fee` parameter**; the pool fee is discovered by the quoter and returned as `fee`.
- Use `limitSqrtPrice = 0` for no price limit.
- Use the returned `fee` when calling the SwapRouter for the actual swap.

### Uniswap V3 QuoterV2 ABI (single-pool)

Uniswap **QuoterV2** (used on Ethereum, Base, Optimism) takes a single **struct** per function and returns four values; the first is the amount. Use `sqrtPriceLimitX96 = 0` for no limit.

```solidity
struct QuoteExactInputSingleParams {
    address tokenIn;
    address tokenOut;
    uint256 amountIn;
    uint24 fee;
    uint160 sqrtPriceLimitX96;
}

struct QuoteExactOutputSingleParams {
    address tokenIn;
    address tokenOut;
    uint256 amount;   // exact amount of tokenOut to receive
    uint24 fee;
    uint160 sqrtPriceLimitX96;
}

// Exact in: how much tokenOut for amountIn of tokenIn?
function quoteExactInputSingle(QuoteExactInputSingleParams calldata params)
    external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate);

// Exact out: how much tokenIn for amountOut of tokenOut?
function quoteExactOutputSingle(QuoteExactOutputSingleParams calldata params)
    external returns (uint256 amountIn, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate);
```

The first return value is `amountOut` (or `amountIn` for quoteExactOutputSingle); the other three are sqrtPriceX96After, initializedTicksCrossed, and gasEstimate.

### Getting the quote (viem)

Quoter functions are not `view`: they simulate the swap and revert with the result. Use `eth_call` and decode the revert data to get the amount.

**Quote exact input (e.g. “I spend 10 collateral → how many outcome tokens?”):**

```typescript
import { decodeFunctionResult, encodeFunctionData, parseUnits } from "viem";
import { getPublicClient } from "./viem-setup";
import { mainnet } from "viem/chains";

const chain = mainnet;
const publicClient = getPublicClient(chain);

// QuoterV2: params are structs; returns (amount, sqrtPriceX96After, initializedTicksCrossed, gasEstimate)
const QUOTER_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          { internalType: "uint24", name: "fee", type: "uint24" },
          { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        internalType: "struct IQuoterV2.QuoteExactInputSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint160", name: "sqrtPriceX96After", type: "uint160" },
      { internalType: "uint32", name: "initializedTicksCrossed", type: "uint32" },
      { internalType: "uint256", name: "gasEstimate", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint24", name: "fee", type: "uint24" },
          { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        internalType: "struct IQuoterV2.QuoteExactOutputSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "quoteExactOutputSingle",
    outputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint160", name: "sqrtPriceX96After", type: "uint160" },
      { internalType: "uint32", name: "initializedTicksCrossed", type: "uint32" },
      { internalType: "uint256", name: "gasEstimate", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const QUOTER_ADDRESSES: Record<number, `0x${string}`> = {
  1: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
  8453: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a",
  10: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
};

async function quoteExactInput(
  chainId: number,
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  fee: number,
  amountIn: bigint,
): Promise<bigint> {
  const quoter = QUOTER_ADDRESSES[chainId];
  if (!quoter) throw new Error(`No quoter for chain ${chainId}`);

  const data = encodeFunctionData({
    abi: QUOTER_ABI,
    functionName: "quoteExactInputSingle",
    args: [{ tokenIn, tokenOut, amountIn, fee, sqrtPriceLimitX96: 0n }],
  });

  const result = await publicClient.call({
    to: quoter,
    data,
    account: "0x0000000000000000000000000000000000000000",
  });

  if (result.data === undefined) throw new Error("Quoter reverted");
  const [amountOut] = decodeFunctionResult({ abi: QUOTER_ABI, functionName: "quoteExactInputSingle", data: result.data });
  return amountOut;
}

async function quoteExactOutput(
  chainId: number,
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  fee: number,
  amountOut: bigint,
): Promise<bigint> {
  const quoter = QUOTER_ADDRESSES[chainId];
  if (!quoter) throw new Error(`No quoter for chain ${chainId}`);

  const data = encodeFunctionData({
    abi: QUOTER_ABI,
    functionName: "quoteExactOutputSingle",
    args: [{ tokenIn, tokenOut, amount: amountOut, fee, sqrtPriceLimitX96: 0n }],
  });

  const result = await publicClient.call({
    to: quoter,
    data,
    account: "0x0000000000000000000000000000000000000000",
  });

  if (result.data === undefined) throw new Error("Quoter reverted");
  const [amountIn] = decodeFunctionResult({ abi: QUOTER_ABI, functionName: "quoteExactOutputSingle", data: result.data });
  return amountIn;
}

// Example: quote 10 DAI → outcome tokens (Ethereum, 0.3% pool)
const amountOut = await quoteExactInput(
  chain.id,
  "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
  "0x...", // outcome token
  3000,
  parseUnits("10", 18),
);
// Use amountOut to set amountOutMinimum with slippage (e.g. amountOut * 99n / 100n)
```

**Swapr quote (Gnosis):** same idea, but use the Swapr Quoter ABI (no `fee` in args; returns `[amountOut, fee]` or `[amountIn, fee]`). Use the returned `fee` when building the swap router call:

```typescript
const SWAPR_QUOTER = "0xcBaD9FDf0D2814659Eb26f600EFDeAF005Eda0F7" as const;

const SWAPR_QUOTER_ABI = [
  {
    inputs: [
      { internalType: "address", name: "tokenIn", type: "address" },
      { internalType: "address", name: "tokenOut", type: "address" },
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint160", name: "limitSqrtPrice", type: "uint160" },
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint16", name: "fee", type: "uint16" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const data = encodeFunctionData({
  abi: SWAPR_QUOTER_ABI,
  functionName: "quoteExactInputSingle",
  args: [collateral, outcomeToken, amountIn, 0n],
});
const result = await publicClient.call({ to: SWAPR_QUOTER, data, account: "0x0000000000000000000000000000000000000000" });
if (result.data === undefined) throw new Error("Quoter reverted");
const [amountOut, fee] = decodeFunctionResult({ abi: SWAPR_QUOTER_ABI, functionName: "quoteExactInputSingle", data: result.data });
// Use amountOut for amountOutMinimum (with slippage) and fee in the router's exactInputSingle params
```

**Note:** Some RPC nodes return failed `eth_call` when the contract reverts, so `result.data` may be undefined even though the revert payload contains the amount. In that case you need to catch the error, read the revert `data` from the error object, and decode it (e.g. with `decodeAbiParameters([{ type: "uint256" }], data)` if the Quoter reverts with a single `uint256`). The pattern above works when the node returns the “success” payload in `result.data`.

---

## Shared: ROUTERS and COLLATERAL

Define these once; the examples below use them as if already in scope.

```typescript
const ROUTERS: Record<number, `0x${string}`> = {
  100: "0xffb643e73f280b97809a8b41f7232ab401a04ee1",   // Swapr (Gnosis)
  1: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",    // Uniswap V3 (Ethereum)
  8453: "0x2626664c2603336E57B271c5C0b26F421741e481",  // Uniswap V3 (Base)
  10: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",   // Uniswap V3 (Optimism)
};

const COLLATERAL: Record<number, `0x${string}`> = {
  100: "0xaf204776c7245bf4147c2612bf6e5972ee483701",   // sDAI (Gnosis)
  1: "0x6B175474E89094C44Da98b954EedeAC495271d0F",    // DAI (Ethereum)
  8453: "0x5875eee11cf8398102fdad704c9e96607675467a", // sUSDS (Base)
  10: "0xb5b2dc7fd34c249f4be7fb1fcea07950784229e0",   // sUSDS (Optimism)
};
```

---

## Example: buy outcome tokens (collateral → outcome)

User spends **collateral** to receive **outcome tokens**. Use `exactInputSingle`: `tokenIn = collateral`, `tokenOut = outcomeToken`.

```typescript
import { encodeFunctionData, parseUnits } from "viem";
import { getPublicClient, getWalletClient, ERC20_APPROVE_ABI } from "./viem-setup";
import { gnosis } from "viem/chains";

const chain = gnosis;
const publicClient = getPublicClient(chain);
const walletClient = getWalletClient(chain, process.env.PRIVATE_KEY! as `0x${string}`);
const account = walletClient.account!;
const chainId = chain.id;

const SWAP_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "uint24", name: "fee", type: "uint24" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          { internalType: "uint256", name: "amountOutMinimum", type: "uint256" },
          { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        internalType: "struct IV3SwapRouter.ExactInputSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInputSingle",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
] as const;

const outcomeToken = "0x..."; // outcome token address (e.g. from market.wrappedTokens[i])
const feeTier = 3000; // 0.3% – must match the pool
const amountIn = parseUnits("10", 18); // 10 units of collateral
const amountOutMinimum = 0n; // in production: quote off-chain and apply slippage (e.g. 0.99 * quote)

// 1. Approve router to spend collateral
await walletClient.writeContract({
  address: COLLATERAL[chainId],
  abi: ERC20_APPROVE_ABI,
  functionName: "approve",
  args: [ROUTERS[chainId], amountIn],
});

// 2. Swap collateral → outcome token
const hash = await walletClient.writeContract({
  address: ROUTERS[chainId],
  abi: SWAP_ROUTER_ABI,
  functionName: "exactInputSingle",
  args: [
    {
      tokenIn: COLLATERAL[chainId],
      tokenOut: outcomeToken,
      fee: feeTier,
      recipient: account.address,
      amountIn,
      amountOutMinimum,
      sqrtPriceLimitX96: 0n,
    },
  ],
});

await publicClient.waitForTransactionReceipt({ hash });
```

---

## Example: sell outcome tokens (outcome → collateral)

User sells **outcome tokens** for **collateral**. Use `exactInputSingle`: `tokenIn = outcomeToken`, `tokenOut = collateral`.

```typescript
import { parseUnits } from "viem";
import { getPublicClient, getWalletClient, ERC20_APPROVE_ABI } from "./viem-setup";
import { gnosis } from "viem/chains";

const chain = gnosis;
const publicClient = getPublicClient(chain);
const walletClient = getWalletClient(chain, process.env.PRIVATE_KEY! as `0x${string}`);
const account = walletClient.account!;
const chainId = chain.id;

const SWAP_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "uint24", name: "fee", type: "uint24" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          { internalType: "uint256", name: "amountOutMinimum", type: "uint256" },
          { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        internalType: "struct IV3SwapRouter.ExactInputSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInputSingle",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
] as const;

const outcomeToken = "0x...";
const feeTier = 3000;
const amountIn = parseUnits("100", 18); // 100 outcome tokens
const amountOutMinimum = 0n; // in production: set from quote with slippage

// 1. Approve router to spend outcome tokens
await walletClient.writeContract({
  address: outcomeToken,
  abi: ERC20_APPROVE_ABI,
  functionName: "approve",
  args: [ROUTERS[chainId], amountIn],
});

// 2. Swap outcome token → collateral
const hash = await walletClient.writeContract({
  address: ROUTERS[chainId],
  abi: SWAP_ROUTER_ABI,
  functionName: "exactInputSingle",
  args: [
    {
      tokenIn: outcomeToken,
      tokenOut: COLLATERAL[chainId],
      fee: feeTier,
      recipient: account.address,
      amountIn,
      amountOutMinimum,
      sqrtPriceLimitX96: 0n,
    },
  ],
});

await publicClient.waitForTransactionReceipt({ hash });
```

---

## Example: buy exact amount of outcome (exactOutputSingle)

When you want to receive **exactly** N outcome tokens and spend at most X collateral, use `exactOutputSingle`:

```typescript
import { parseUnits } from "viem";
import { getPublicClient, getWalletClient, ERC20_APPROVE_ABI } from "./viem-setup";
import { gnosis } from "viem/chains";

const chain = gnosis;
const publicClient = getPublicClient(chain);
const walletClient = getWalletClient(chain, process.env.PRIVATE_KEY! as `0x${string}`);
const account = walletClient.account!;
const chainId = chain.id;

const outcomeToken = "0x...";
const feeTier = 3000;

const EXACT_OUTPUT_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "uint24", name: "fee", type: "uint24" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "amountOut", type: "uint256" },
          { internalType: "uint256", name: "amountInMaximum", type: "uint256" },
          { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        internalType: "struct IV3SwapRouter.ExactOutputSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactOutputSingle",
    outputs: [{ internalType: "uint256", name: "amountIn", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
] as const;

const amountOut = parseUnits("50", 18);   // exactly 50 outcome tokens
const amountInMaximum = parseUnits("100", 18); // willing to spend up to 100 collateral (slippage)

// 1. Approve router to spend up to amountInMaximum of collateral
await walletClient.writeContract({
  address: COLLATERAL[chainId],
  abi: ERC20_APPROVE_ABI,
  functionName: "approve",
  args: [ROUTERS[chainId], amountInMaximum],
});

// 2. Swap: receive exactly amountOut of outcome token, spend at most amountInMaximum of collateral
const hash = await walletClient.writeContract({
  address: ROUTERS[chainId],
  abi: EXACT_OUTPUT_ABI,
  functionName: "exactOutputSingle",
  args: [
    {
      tokenIn: COLLATERAL[chainId],
      tokenOut: outcomeToken,
      fee: feeTier,
      recipient: account.address,
      amountOut,
      amountInMaximum,
      sqrtPriceLimitX96: 0n,
    },
  ],
});

await publicClient.waitForTransactionReceipt({ hash });
```

---

## Token order and pool fee

- **Token order** in the pool is defined by the contract (token0 &lt; token1 by address). Your swap’s `tokenIn` / `tokenOut` are the token addresses; the router uses the correct pool.
- **Fee tier** must match the existing pool (e.g. 3000 for 0.3%). You can read it from the pool contract or from the DEX subgraph (e.g. Swapr on Gnosis, Uniswap on other chains).

For reference, the app derives the liquidity pair (outcome token vs collateral) in [getLiquidityPair](../../web/src/lib/market.ts) and uses the same router ABI for both [Swapr](../../web/src/hooks/trade/executeSwaprTrade.ts) and [Uniswap](../../web/src/hooks/trade/executeUniswapTrade.ts).
