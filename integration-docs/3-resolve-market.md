# Resolve a market

To resolve a market, the user calls the <mark style="color:red;">`resolve`</mark> function on the <mark style="color:red;">`Market`</mark> contract.

---

## Prerequisites

Before resolution can succeed:

- The Reality question(s) must be **answerable**: `block.timestamp >= openingTime` (opening time is set at market creation).
- The question(s) must be **answered** on Reality.eth (someone called `submitAnswer` with sufficient bond).
- The question(s) must be **finalized** (e.g. timeout passed, no reopen), so that `realitio.resultForOnceSettled(questionId)` returns a settled result.

If these are not met, the resolution transaction will revert.

---

## After resolution: redeeming

Once the market is resolved, users can redeem winning position tokens for the underlying collateral via the <mark style="color:red;">`Router`</mark> contract (merge and redeem flow).

---

## Using @seer-pm/sdk (recommended)

The **@seer-pm/sdk** provides `getResolveMarketExecution(marketAddress, chainId)`. Send the result with your wallet client.

### Resolve the market

```typescript
import { getPublicClient, getWalletClient } from "./viem-setup";
import { gnosis } from "viem/chains";
import { getResolveMarketExecution } from "@seer-pm/sdk";

const chain = gnosis;
const publicClient = getPublicClient(chain);
const walletClient = getWalletClient(chain, process.env.PRIVATE_KEY! as `0x${string}`);
const account = walletClient.account!;

const marketAddress = "0x..."; // Market contract address

const execution = getResolveMarketExecution(marketAddress, chain.id);

const hash = await walletClient.sendTransaction(execution);
const receipt = await publicClient.waitForTransactionReceipt({ hash });
```

### Simulate before sending

To avoid reverts (e.g. question not yet settled), simulate the call first with `publicClient.call`. It uses the same payload as the transaction and does not change state ([viem: simulateContract](https://viem.sh/docs/contract/simulateContract#simulatecontract)):

```typescript
const execution = getResolveMarketExecution(marketAddress, chain.id);

await publicClient.call({
  to: execution.to,
  data: execution.data,
  value: execution.value,
  account: account.address,
});

const hash = await walletClient.sendTransaction(execution);
const receipt = await publicClient.waitForTransactionReceipt({ hash });
```

---
