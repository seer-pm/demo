# Viem client setup

The integration examples in this folder use [viem](https://viem.sh) with a **public client** (read-only) and a **wallet client** (signed transactions). Create both once and reuse them across [Create a market](2-create-market.md), [Resolve a market](3-resolve-market.md), [Split, merge and redeem](4-split-merge-and-redeem.md), [Conditional market](5-conditional-market.md), and [Futarchy markets](6-futarchy-markets.md).

**Note:** The viem configuration below is provided as an example. If your project already has `publicClient` and `walletClient` (e.g. from Wagmi, RainbowKit or another library), you can use them directly; the examples in this documentation only need clients compatible with viem’s interface for `readContract`, `simulateContract`, `writeContract`, and `waitForTransactionReceipt`.

---

## Dependencies

```bash
npm i viem
npm i @seer-pm/sdk
```

The examples in [Create a market](2-create-market.md), [Resolve a market](3-resolve-market.md), and [Split, merge and redeem](4-split-merge-and-redeem.md) use **@seer-pm/sdk**.

---

## Client helpers

Create two helpers that take a **chain** (from `viem/chains`) so the same code works on any network. The wallet client needs a **private key** (e.g. from `process.env.PRIVATE_KEY`).

```typescript
import { createPublicClient, createWalletClient, http } from "viem";
import type { Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export function getPublicClient(chain: Chain) {
  return createPublicClient({
    chain,
    transport: http(),
  });
}

export function getWalletClient(chain: Chain, privateKey: `0x${string}`) {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    chain,
    transport: http(),
    account,
  });
}

/** ERC20 `approve(spender, amount)` ABI. Use for collateral and outcome token approvals (split, merge, redeem, swaps). */
export const ERC20_APPROVE_ABI = [
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
] as const;

```

For Market contract reads (`resolve`, `wrappedOutcome`, `parentMarket`, `numOutcomes`, etc.) use **marketAbi** from **@seer-pm/sdk**: `import { marketAbi } from "@seer-pm/sdk"`.

**Usage (any chain):**

```typescript
import { gnosis } from "viem/chains"; // or mainnet, base, optimism, etc.

const chain = gnosis;
const publicClient = getPublicClient(chain);
const walletClient = getWalletClient(chain, process.env.PRIVATE_KEY! as `0x${string}`);
const account = walletClient.account; // for simulateContract({ account: account.address })
```

- **publicClient**: for `readContract`, `simulateContract`, `waitForTransactionReceipt`, etc.
- **walletClient**: for `writeContract` (sending transactions).
- **account**: use `account.address` when calling `simulateContract` with an explicit account.

---

## Using in the integration docs

In the rest of the integration docs we obtain clients with `getPublicClient(chain)` and `getWalletClient(chain, process.env.PRIVATE_KEY!)`. Contract addresses come from **@seer-pm/sdk** (e.g. `getMarketFactoryAddress(chainId)`, `getRouterAddress(market)`, `getFutarchyFactoryAddress(chainId)`). Import `ERC20_APPROVE_ABI` from this setup module; import `marketAbi` from **@seer-pm/sdk** for market reads (`wrappedOutcome`, `resolve`, etc.). Choose any chain from `viem/chains` (e.g. `gnosis`, `mainnet`, `base`); the examples are the same for all networks.
