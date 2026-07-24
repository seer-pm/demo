# Trading outcome tokens

Outcome tokens (CTF positions) are traded on AMMs. Pools are always **outcome token / main collateral** for the chain.

Quotes and swaps go through **Lens** (`lensQuoter` / `lensRouter`), which aggregates Uniswap V3 and Swapr (Algebra) on-chain. CoW Swap remains available as an optional path.

Use **@seer-pm/sdk** to get quotes and build swap flows. The SDK handles routing, amounts, and slippage for all supported chains (Gnosis, Ethereum, Base, Optimism).

---

## Main collateral by chain

Each market’s pool is **outcome token / that market’s collateral** (`market.collateralToken`). On Gnosis, multiple primaries are registered (sDAI, s-gCRC); call `configureCollateral` for the profile your site uses, then use `getActivePrimaryCollateral` for quotes and swaps.

```typescript
import { getActivePrimaryCollateral, type Token } from "@seer-pm/sdk";

const chainId = 100; // gnosis

// After configureCollateral (defaults to "default" / sDAI):
const collateralToken: Token = getActivePrimaryCollateral(chainId);
```

| Chain | Registered primaries (examples) |
|-------|----------------------------------|
| Gnosis (100) | sDAI `0xaf20…3701`, s-gCRC `0x548c…4bC1` |
| Ethereum (1) | sDAI |
| Base (8453) | sUSDS |
| Optimism (10) | sUSDS |

See [Collateral profiles](9-collateral-profiles.md) for the full registry and white-label configuration.

---

## Getting quotes with @seer-pm/sdk

**Chain coverage:**

- **AMM (Lens)** on Gnosis, Ethereum, Base, Optimism: `fetchAmmQuote` with `TradeType` (exact-in / exact-out). Requires a viem `PublicClient`.
- **CoW Swap** (optional): `getCowQuote` / `getCowQuoteExactOut` (or `fetchCowQuote` with `TradeType`).

**Result type:** `QuoteTradeResult` — `value` (bigint), `decimals`, `buyToken`, `sellToken`, `sellAmount`, `swapType`, and `trade` (`AmmTrade` for Lens, or `CoWTrade` for CoW).

### Token and collateral

```typescript
import {
  TradeType,
  fetchAmmQuote,
  getActivePrimaryCollateral,
  type QuoteTradeResult,
  type Token,
} from "@seer-pm/sdk";
import type { PublicClient } from "viem";
import { gnosis } from "viem/chains";

const chainId = gnosis.id;
const collateralToken = getActivePrimaryCollateral(chainId);

const outcomeToken: Token = {
  address: "0x...", // wrapped outcome token address (e.g. market.wrappedTokens[i])
  chainId,
  symbol: "SEER_OUTCOME",
  decimals: 18,
};
```

### Quote: exact input (e.g. “I spend 10 collateral → how many outcome tokens?”)

```typescript
import {
  TradeType,
  fetchAmmQuote,
  getActivePrimaryCollateral,
  type QuoteTradeResult,
  type Token,
} from "@seer-pm/sdk";
import type { PublicClient } from "viem";
import { gnosis } from "viem/chains";

const chainId = gnosis.id;
const collateralToken = getActivePrimaryCollateral(chainId);
const outcomeToken: Token = { address: "0x...", chainId, symbol: "SEER_OUTCOME", decimals: 18 };

const quote: QuoteTradeResult = await fetchAmmQuote(
  publicClient as PublicClient,
  TradeType.EXACT_INPUT,
  chainId,
  undefined, // or user address
  "10", // amount in collateral (string)
  outcomeToken,
  collateralToken,
  "buy", // swapType: "buy" = collateral → outcome
  "1", // maxSlippage percent (e.g. "1" = 1%)
);

// quote.value = bigint amount of outcome tokens
// quote.trade = AmmTrade (use for execution)
const amountOut = quote.value;
const amountOutMinimum = quote.trade.minimumAmountOut(); // AmmTrade helper with slippage
```

### Quote: exact output (e.g. “I want exactly N outcome tokens → how much collateral?”)

```typescript
import { TradeType, fetchAmmQuote, getActivePrimaryCollateral, type Token } from "@seer-pm/sdk";
import type { PublicClient } from "viem";
import { gnosis } from "viem/chains";

const chainId = gnosis.id;
const collateralToken = getActivePrimaryCollateral(chainId);
const outcomeToken: Token = { address: "0x...", chainId, symbol: "SEER_OUTCOME", decimals: 18 };

const quote = await fetchAmmQuote(
  publicClient as PublicClient,
  TradeType.EXACT_OUTPUT,
  chainId,
  undefined,
  "50", // exact amount of outcome tokens desired
  outcomeToken,
  collateralToken,
  "buy",
  "1",
);

// quote.value = bigint amount of collateral (input) needed
const amountInMaximum = quote.trade.maximumAmountIn();
```

### Using TradeType for exact-in vs exact-out

```typescript
import { TradeType, fetchAmmQuote, getActivePrimaryCollateral, type Token } from "@seer-pm/sdk";
import type { PublicClient } from "viem";
import { mainnet } from "viem/chains";

async function getQuote(
  publicClient: PublicClient,
  tradeType: TradeType,
  chainId: number,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  maxSlippage: string,
) {
  return fetchAmmQuote(
    publicClient,
    tradeType,
    chainId,
    undefined,
    amount,
    outcomeToken,
    collateralToken,
    swapType,
    maxSlippage,
  );
}

const collateralToken = getActivePrimaryCollateral(mainnet.id);
const outcomeToken: Token = { address: "0x...", chainId: mainnet.id, symbol: "SEER_OUTCOME", decimals: 18 };

const exactInQuote = await getQuote(
  publicClient,
  TradeType.EXACT_INPUT,
  mainnet.id,
  "10",
  outcomeToken,
  collateralToken,
  "buy",
  "1",
);

const exactOutQuote = await getQuote(
  publicClient,
  TradeType.EXACT_OUTPUT,
  mainnet.id,
  "50",
  outcomeToken,
  collateralToken,
  "buy",
  "1",
);
```

Use `fetchCowQuote` the same way when integrating CoW Swap (e.g. for limit orders); it accepts an optional `isFastQuery` for quote speed vs optimal price.

---

## Executing the swap

The SDK provides execution functions that take a `trade` (from a quote) and send the transaction. You need **wagmi** (config, `getConnectorClient`) and optionally a toast/notification layer for UX.

### Execute any trade (CoW or Lens AMM)

Use `tradeTokens` to execute any trade type. It dispatches to CoW Swap or Lens AMM automatically.

**`getSigner` is only required if you want to support CoW Swap trades.** If you omit it, AMM trades work as usual; CoW Swap trades will throw. So you can pass just `{ config }` if you only use Lens:

```typescript
import { tradeTokens, type TradeTokensProps } from "@seer-pm/sdk";
import { config } from "@/wagmi";

// Lens AMM only (no CoW Swap)
const adapters = { config };

const props: TradeTokensProps = {
  trade: quote.trade,
  account: "0x...",
  isSeerCredits: false,
};

const result = await tradeTokens(props, adapters); // tx hash
```

To support CoW Swap as well, add `getSigner`:

```typescript
import { tradeTokens, clientToSigner, type TradeTokensProps } from "@seer-pm/sdk";
import { config } from "@/wagmi";
import { getConnectorClient } from "@wagmi/core";

const adapters = {
  config,
  getSigner: async () => {
    const client = await getConnectorClient(config);
    if (!client) throw new Error("No wallet connected");
    return clientToSigner(client);
  },
};

// Returns order ID (CoW Swap) or tx hash (Lens AMM)
const result = await tradeTokens(props, adapters);
```

Wrap with `toastifyTx` (AMM) or `toastify` (CoW Swap) in your app to show "Executing..." and "Done!" notifications.

### Execute Lens AMM trade

```typescript
import { executeAmmTrade } from "@seer-pm/sdk";
import { config } from "@/wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";

const hash = await executeAmmTrade(
  config,
  trade, // AmmTrade from fetchAmmQuote
  account,
  false, // isSeerCredits
);

const receipt = await waitForTransactionReceipt(config, { hash });
```

### Execute CoW Swap trade (Gnosis)

CoW Swap trades need a signer (ethers). Use `clientToSigner` to convert a wagmi client:

```typescript
import { executeCoWTrade, clientToSigner } from "@seer-pm/sdk";
import { config } from "@/wagmi";
import { getConnectorClient } from "@wagmi/core";

const client = await getConnectorClient(config);
const signer = clientToSigner(client!);

const orderId = await executeCoWTrade(signer, trade);
// orderId = CoW Swap order UID (track status via CoW Swap API)
```

### Execute with 7702 batch (approvals + swap)

For wallets that support [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702), you can batch approvals and the swap in a single flow:

```typescript
import { buildTradeCalls7702, type TradeTokensProps } from "@seer-pm/sdk";
import { config } from "@/wagmi";
import { sendCalls, waitForCallsStatus, waitForTransactionReceipt } from "@wagmi/core";

const props: TradeTokensProps = {
  trade,
  account: "0x...",
  isSeerCredits: false,
};

const calls = await buildTradeCalls7702(props);
const { id } = await sendCalls(config, { calls, chainId: trade.chainId });

const { receipts = [] } = await waitForCallsStatus(config, { id });
const receipt = await waitForTransactionReceipt(config, {
  hash: receipts[0].transactionHash!,
});
```

**Note:** `buildTradeCalls7702` does not support CoW Swap trades; use `tradeTokens` for CoW Swap.

### Build execution without sending

To build the transaction data and send it yourself:

```typescript
import { buildAmmTradeExecution } from "@seer-pm/sdk";
import { sendTransaction } from "@wagmi/core";

const exec = await buildAmmTradeExecution(trade, account, false);
const hash = await sendTransaction(config, exec);
```
