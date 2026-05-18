# Trading outcome tokens

Outcome tokens (CTF positions) are traded on AMMs. Pools are always **outcome token / main collateral** for the chain.

- **Gnosis**: [Swapr](https://v3.swapr.eth.limo/) (Algebra V3)
- **Ethereum, Base, Optimism**: [Uniswap V3](https://app.uniswap.org/)

Use **@seer-pm/sdk** to get quotes and build swap flows. The SDK handles routing, amounts, and slippage for all supported chains.

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

The SDK provides quote functions so you can get **how much the user will receive or spend** for any swap. Use these when building swap UIs.

**Chain coverage:**

- **Gnosis**: `getSwaprQuote` / `getSwaprQuoteExactOut` (or `fetchSwaprQuote` with `TradeType`)
- **Ethereum, Base, Optimism**: `getUniswapQuote` / `getUniswapQuoteExactOut` (or `fetchUniswapQuote` with `TradeType`)
- **CoW Swap** (optional): `getCowQuote` / `getCowQuoteExactOut` (or `fetchCowQuote` with `TradeType`)

**Result type:** `QuoteTradeResult` — `value` (bigint), `decimals`, `buyToken`, `sellToken`, `sellAmount`, `swapType`, and `trade` (the full route/trade object from @swapr/sdk that you can use to execute the swap).

### Token and collateral

Use the `Token` type and collateral from the SDK:

```typescript
import {
  getActivePrimaryCollateral,
  getSwaprQuote,
  getUniswapQuote,
  type QuoteTradeResult,
  type Token,
} from "@seer-pm/sdk";
import { TradeType } from "@swapr/sdk";
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

**Gnosis (Swapr):**

```typescript
import { getActivePrimaryCollateral, getSwaprQuote, type QuoteTradeResult, type Token } from "@seer-pm/sdk";
import { gnosis } from "viem/chains";

const chainId = gnosis.id;
const collateralToken = getActivePrimaryCollateral(chainId);
const outcomeToken: Token = { address: "0x...", chainId, symbol: "SEER_OUTCOME", decimals: 18 };

const quote: QuoteTradeResult = await getSwaprQuote(
  chainId,
  undefined, // or user address
  "10",     // amount in collateral (string)
  outcomeToken,
  collateralToken,
  "buy",    // swapType: "buy" = collateral → outcome
  "1",     // maxSlippage percent (e.g. "1" = 1%)
);

// quote.value = bigint amount of outcome tokens
// quote.trade = full SwaprV3Trade (use for execution)
const amountOut = quote.value;
const amountOutMinimum = (amountOut * 99n) / 100n; // 1% slippage
```

**Ethereum / Base / Optimism (Uniswap):**

```typescript
import { getActivePrimaryCollateral, getUniswapQuote, type Token } from "@seer-pm/sdk";
import { mainnet } from "viem/chains";

const chainId = mainnet.id;
const collateralToken = getActivePrimaryCollateral(chainId);
const outcomeToken: Token = { address: "0x...", chainId, symbol: "SEER_OUTCOME", decimals: 18 };

const quote = await getUniswapQuote(
  chainId,
  undefined,
  "10",
  outcomeToken,
  collateralToken,
  "buy",
  "1",
);

const amountOut = quote.value;
const amountOutMinimum = (amountOut * 99n) / 100n;
```

### Quote: exact output (e.g. “I want exactly N outcome tokens → how much collateral?”)

Use the exact-out variants or the `fetch*` helpers with `TradeType.EXACT_OUTPUT`:

```typescript
import { getActivePrimaryCollateral, fetchSwaprQuote, type Token } from "@seer-pm/sdk";
import { TradeType } from "@swapr/sdk";
import { gnosis } from "viem/chains";

const chainId = gnosis.id;
const collateralToken = getActivePrimaryCollateral(chainId);
const outcomeToken: Token = { address: "0x...", chainId, symbol: "SEER_OUTCOME", decimals: 18 };

const quote = await fetchSwaprQuote(
  TradeType.EXACT_OUTPUT,
  chainId,
  undefined,
  "50",    // exact amount of outcome tokens desired
  outcomeToken,
  collateralToken,
  "buy",
  "1",
);

// quote.value = bigint amount of collateral (input) needed
const amountInMaximum = (quote.value * 101n) / 100n; // 1% slippage
```

### Using the fetch* helpers (exact-in vs exact-out by TradeType)

When you have a `TradeType` (e.g. from UI), use one function for both modes:

```typescript
import { getActivePrimaryCollateral, fetchUniswapQuote, type Token } from "@seer-pm/sdk";
import { TradeType } from "@swapr/sdk";
import { mainnet } from "viem/chains";

async function getQuote(
  tradeType: TradeType,
  chainId: number,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  maxSlippage: string,
) {
  return fetchUniswapQuote(
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
  TradeType.EXACT_INPUT,
  mainnet.id,
  "10",
  outcomeToken,
  collateralToken,
  "buy",
  "1",
);

const exactOutQuote = await getQuote(
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

### Execute any trade (CoW Swap, Swapr, Uniswap)

Use `tradeTokens` to execute any trade type. It dispatches to CoW Swap, Swapr, or Uniswap automatically.

**`getSigner` is only required if you want to support CoW Swap trades.** If you omit it, Swapr and Uniswap trades work as usual; CoW Swap trades will throw. So you can pass just `{ config }` if you only use Swapr/Uniswap:

```typescript
import { tradeTokens, type TradeTokensProps } from "@seer-pm/sdk";
import { config } from "@/wagmi";

// Swapr/Uniswap only (no CoW Swap)
const adapters = { config };

const props: TradeTokensProps = {
  trade: quote.trade,
  account: "0x...",
  isBuyExactOutputNative: false,
  isSellToNative: false,
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

// Returns order ID (CoW Swap) or tx hash (Swapr/Uniswap)
const result = await tradeTokens(props, adapters);
```

Wrap with `toastifyTx` (Swapr/Uniswap) or `toastify` (CoW Swap) in your app to show "Executing..." and "Done!" notifications.

### Execute Swapr trade (Gnosis)

```typescript
import { executeSwaprTrade } from "@seer-pm/sdk";
import { config } from "@/wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";

const hash = await executeSwaprTrade(
  config,
  trade,       // SwaprV3Trade from getSwaprQuote
  account,
  false,       // isBuyExactOutputNative
  false,       // isSellToNative
  false,       // isSeerCredits
);

const receipt = await waitForTransactionReceipt(config, { hash });
```

### Execute Uniswap trade (Ethereum, Base, Optimism)

```typescript
import { executeUniswapTrade } from "@seer-pm/sdk";
import { config } from "@/wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";

const hash = await executeUniswapTrade(config, trade, account, false);
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
  isBuyExactOutputNative: false,
  isSellToNative: false,
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
import {
  buildSwaprTradeExecution,
  buildUniswapTradeExecution,
} from "@seer-pm/sdk";
import { sendTransaction } from "@wagmi/core";

// Swapr (Gnosis)
const swaprExec = await buildSwaprTradeExecution(
  trade,
  account,
  false,  // isBuyExactOutputNative
  false,  // isSellToNative
  false,  // isSeerCredits
);
const hash = await sendTransaction(config, swaprExec);

// Uniswap (Ethereum, Base, Optimism)
const uniswapExec = await buildUniswapTradeExecution(trade, account, false);
const hash = await sendTransaction(config, uniswapExec);
```
