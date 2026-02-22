# Integration docs – Overview

This folder contains step-by-step guides for **integrating with** the Seer prediction market protocol: how to call the contracts, which parameters to pass, and concrete examples. The docs use [viem](https://viem.sh) for blockchain interaction and cover **MarketFactory**, **Market**, **Router**, and related contracts from an integrator’s perspective (no internal implementation details).

---

## Documents

| File | Description |
|------|-------------|
| **[1-viem-setup.md](1-viem-setup.md)** | How to set up a viem **public client** (read-only) and **wallet client** (signed transactions) for any chain. Includes dependencies, client helpers, and basic usage. Start here if you don’t already have viem clients (e.g. from Wagmi or RainbowKit). |
| **[2-create-market.md](2-create-market.md)** | Creating markets via **MarketFactory**: the four market types (categorical, multi categorical, scalar, multi scalar), their Reality.eth templates, outcome slots, bounds, and question encoding. Covers params, ABIs, and viem examples for each creation function. |
| **[3-resolve-market.md](3-resolve-market.md)** | Resolving a market by calling **Market.resolve()**. Prerequisites (opening time, answered and finalized Reality question), and how to redeem winning positions after resolution via the Router. |
| **[4-split-merge-and-redeem.md](4-split-merge-and-redeem.md)** | Using the **Router** (and chain-specific **GnosisRouter** / **MainnetRouter**) to **split** collateral into outcome tokens, **merge** outcome tokens back to collateral, and **redeem** winning positions. Explains collateral per chain and conditional-market flows. |
| **[5-conditional-market.md](5-conditional-market.md)** | **Conditional markets** that depend on a parent market outcome. Creating them with MarketFactory (parent market + parent outcome), and split/merge/redeem using the parent’s outcome token as collateral. |
| **[6-futarchy-markets.md](6-futarchy-markets.md)** | **Futarchy proposals**: markets with two collateral tokens and four outcomes (Yes/No per token). Creating via **FutarchyFactory.createProposal**, and split/merge/redeem via **FutarchyRouter**; resolution via **FutarchyRealityProxy** or the proposal contract. |
| **[7-trading.md](7-trading.md)** | **Trading outcome tokens** on AMMs: Swapr (Algebra V3) on Gnosis and Uniswap V3 on Ethereum, Base, and Optimism. Main collateral and router addresses per chain, shared router ABI, and viem examples for swaps (exactInputSingle / exactOutputSingle). |
| **[8-api.md](8-api.md)** | Reference for the app’s **Netlify serverless API** (e.g. `get-market`, and other functions). Request/response formats, parameters, and usage for integrations, frontends, and tools that consume the Seer app backend. |

---

**Suggested order:** Start with [1-viem-setup.md](1-viem-setup.md), then [2-create-market.md](2-create-market.md) and [3-resolve-market.md](3-resolve-market.md). Use [4-split-merge-and-redeem.md](4-split-merge-and-redeem.md) for position lifecycle; [5-conditional-market.md](5-conditional-market.md) and [6-futarchy-markets.md](6-futarchy-markets.md) for advanced market types; [7-trading.md](7-trading.md) for AMM trading; [8-api.md](8-api.md) when you need the app’s HTTP API.

---

## For AI Agents

Use this folder when integrating with or building tools that interact with the Seer prediction market protocol. Quick map by intent:

| Intent | Document |
|--------|----------|
| **Setup (viem clients)** | [1-viem-setup.md](1-viem-setup.md) |
| **Create market** | [2-create-market.md](2-create-market.md) |
| **Resolve market** | [3-resolve-market.md](3-resolve-market.md) |
| **Split, merge, redeem positions** | [4-split-merge-and-redeem.md](4-split-merge-and-redeem.md) |
| **Conditional markets** | [5-conditional-market.md](5-conditional-market.md) |
| **Futarchy markets** | [6-futarchy-markets.md](6-futarchy-markets.md) |
| **Trading on AMMs** | [7-trading.md](7-trading.md) |
| **HTTP API (get-market, search, portfolio, etc.)** | [8-api.md](8-api.md) |

Typical flow: setup (1) → create or fetch market (2 or 8) → split/merge/trade (4, 7) → resolve (3) → redeem (4).
