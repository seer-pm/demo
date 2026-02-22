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

## Viem examples

We use the [Viem setup](1-viem-setup.md): `getPublicClient(chain)` and `getWalletClient(chain, process.env.PRIVATE_KEY)`.

### Shared: ABI and address

```typescript
import { getPublicClient, getWalletClient, MARKET_ABI } from "./viem-setup";
import { gnosis } from "viem/chains"; // or mainnet, base, etc.

const chain = gnosis;
const publicClient = getPublicClient(chain);
const walletClient = getWalletClient(chain, process.env.PRIVATE_KEY! as `0x${string}`);
const account = walletClient.account!;

const marketAddress = "0x..."; // Market contract address
```

### Resolve the market

Call `resolve()` on the Market contract:

```typescript
const hash = await walletClient.writeContract({
  address: marketAddress,
  abi: MARKET_ABI,
  functionName: "resolve",
  args: [],
});

const receipt = await publicClient.waitForTransactionReceipt({ hash });
```

### Simulate before sending

To avoid reverts (e.g. question not yet settled), simulate first:

```typescript
const { request } = await publicClient.simulateContract({
  account: account.address,
  address: marketAddress,
  abi: MARKET_ABI,
  functionName: "resolve",
  args: [],
});

const hash = await walletClient.writeContract(request);
const receipt = await publicClient.waitForTransactionReceipt({ hash });
```
