import type { SupportedChain } from "@seer-pm/sdk";
import { TransactionNotFoundError, TransactionReceiptNotFoundError, WaitForTransactionReceiptTimeoutError } from "viem";
import { getTransactionReceipt, waitForTransactionReceipt } from "viem/actions";
import { getPublicClientByChainId } from "./config";

export const waitForContractWrite = async (contractWrite: () => Promise<`0x${string}`>, chainId: SupportedChain) => {
  let hash: `0x${string}` | undefined = undefined;
  try {
    const publicClient = getPublicClientByChainId(chainId);
    hash = await contractWrite();
    const receipt = await waitForTransactionReceipt(publicClient, {
      hash,
    });
    return { status: true, receipt: receipt };
    // biome-ignore lint/suspicious/noExplicitAny:
  } catch (error: any) {
    // timeout so we poll manually
    if (
      hash &&
      (error instanceof WaitForTransactionReceiptTimeoutError ||
        error instanceof TransactionNotFoundError ||
        error instanceof TransactionReceiptNotFoundError)
    ) {
      const newReceipt = await pollForTransactionReceipt(chainId, hash);
      if (newReceipt) {
        return { status: true, receipt: newReceipt };
      }
    }
    return { status: false, error };
  }
};

async function pollForTransactionReceipt(
  chainId: SupportedChain,
  hash: `0x${string}`,
  maxAttempts = 7,
  initialInterval = 500,
) {
  const publicClient = getPublicClientByChainId(chainId);
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const txReceipt = await getTransactionReceipt(publicClient, { hash });
      if (txReceipt?.blockNumber) {
        return txReceipt;
      }
    } catch (e) {
      console.warn(`Failed to get transaction receipt for ${hash}, attempt ${i + 1}:`, e);
    }
    const backoffTime = initialInterval * 2 ** i;
    const jitter = Math.round(Math.random() * 1000); // Add some randomness to prevent synchronized retries
    await new Promise((resolve) => setTimeout(resolve, backoffTime + jitter));
  }

  return null;
}
