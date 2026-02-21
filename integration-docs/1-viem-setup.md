# Viem client setup

The integration examples in this folder use [viem](https://viem.sh) with a **public client** (read-only) and a **wallet client** (signed transactions). Create both once and reuse them across [Create a market](2-create-market.md), [Resolve a market](3-resolve-market.md), [Split, merge and redeem](4-split-merge-and-redeem.md), [Conditional market](5-conditional-market.md), and [Futarchy markets](6-futarchy-markets.md).

**Note:** The viem configuration below is provided as an example. If your project already has `publicClient` and `walletClient` (e.g. from Wagmi, RainbowKit or another library), you can use them directly; the examples in this documentation only need clients compatible with viem’s interface for `readContract`, `simulateContract`, `writeContract`, and `waitForTransactionReceipt`.

---

## Dependencies

```bash
npm i viem
```

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
```

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

## Deployed contracts by chain

Contract addresses per chain ID. Use the entry for your chain when calling the contracts (e.g. `SEER_CONTRACTS[chain.id]`).

| Chain ID | Chain   |
|----------|---------|
| 1        | Ethereum Mainnet |
| 10       | Optimism |
| 100      | Gnosis   |
| 8453     | Base     |

Export the `SEER_CONTRACTS` object from your setup module so the integration docs can use it. Get addresses for the current chain with `SEER_CONTRACTS[chain.id]`:

```typescript
export const SEER_CONTRACTS = {
  100: {
    ConditionalRouter: "0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c",
    FutarchyFactory: "0xe789e4A240d153AC55e32106821e785E71f6b792",
    FutarchyProposal: "0xec4fb999Db0e8cA28011D85EAD177810055b484c",
    FutarchyRealityProxy: "0x03E1fCfE3F1edc5833001588fb6377cB50A61cfc",
    FutarchyRouter: "0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E",
    GnosisRouter: "0xeC9048b59b3467415b1a38F63416407eA0c70fB8",
    Market: "0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a",
    MarketFactory: "0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1",
    MarketView: "0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C",
    RealityProxy: "0xc260ADfAC11f97c001dC143d2a4F45b98e0f2D6C",
    Wrapped1155Factory: "0xD194319D1804C1051DD21Ba1Dc931cA72410B79f",
  },
  1: {
    ConditionalRouter: "0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5",
    MainnetRouter: "0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6",
    Market: "0x8bdC504dC3A05310059c1c67E0A2667309D27B93",
    MarketFactory: "0x1F728c2fD6a3008935c1446a965a313E657b7904",
    MarketView: "0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a",
    Realitio_v2_1_ArbitratorWithAppeals: "0x2018038203aEE8e7a29dABd73771b0355D4F85ad",
    RealityProxy: "0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E",
    Wrapped1155Factory: "0xD194319D1804C1051DD21Ba1Dc931cA72410B79f",
  },
  10: {
    ConditionalRouter: "0x3124e97ebF4c9592A17d40E54623953Ff3c77a73",
    Market: "0xAb797C4C6022A401c31543E316D3cd04c67a87fC",
    MarketFactory: "0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6",
    MarketView: "0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00",
    RealityProxy: "0xfE8bF5140F00de6F75BAFa3Ca0f4ebf2084A46B2",
    Router: "0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD",
    Wrapped1155Factory: "0xd194319d1804c1051dd21ba1dc931ca72410b79f",
  },
  8453: {
    ConditionalRouter: "0xF5ccbf74121edBa492725F325D55356D517723B9",
    Market: "0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E",
    MarketFactory: "0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6",
    MarketView: "0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD",
    RealityProxy: "0xfE8bF5140F00de6F75BAFa3Ca0f4ebf2084A46B2",
    Router: "0x3124e97ebF4c9592A17d40E54623953Ff3c77a73",
    Wrapped1155Factory: "0xd194319d1804c1051dd21ba1dc931ca72410b79f",
  },
} as const;

// In your script: const addresses = SEER_CONTRACTS[chain.id];
// addresses.Market, addresses.MarketFactory, addresses.MarketView, ...
```

---

## Using in the integration docs

In the rest of the integration docs we obtain clients with `getPublicClient(chain)` and `getWalletClient(chain, process.env.PRIVATE_KEY!)`, and use `SEER_CONTRACTS[chain.id]` for addresses. Choose any chain from `viem/chains` (e.g. `gnosis`, `mainnet`, `base`); the examples are the same for all networks.
