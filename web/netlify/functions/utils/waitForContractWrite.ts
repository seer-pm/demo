import { SupportedChain } from "@/lib/chains";
import { getTransactionReceipt, waitForTransactionReceipt } from "@wagmi/core";
import { TransactionNotFoundError, TransactionReceiptNotFoundError, WaitForTransactionReceiptTimeoutError } from "viem";
import { config } from "./config";

export const waitForContractWrite = async (contractWrite: () => Promise<`0x${string}`>, chainId: SupportedChain) => {
  let hash: `0x${string}` | undefined = undefined;
  try {
    hash = await contractWrite();
    const receipt = await waitForTransactionReceipt(config, {
      hash,
      ...(chainId && { chainId }),
    });
    return { status: true, receipt: receipt };
    // biome-ignore lint/suspicious/noExplicitAny:
  } catch (error: any) {
    // timeout so we poll manually
    if (
      hash &&
      error instanceof
        (WaitForTransactionReceiptTimeoutError || TransactionNotFoundError || TransactionReceiptNotFoundError)
    ) {
      const newReceipt = await pollForTransactionReceipt(hash);
      if (newReceipt) {
        return { status: true, receipt: newReceipt };
      }
    }
    return { status: false, error };
  }
};

async function pollForTransactionReceipt(hash: `0x${string}`, maxAttempts = 7, initialInterval = 500) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const txReceipt = await getTransactionReceipt(config, { hash });
      if (txReceipt?.blockNumber) {
        return txReceipt;
      }
    } catch (e) {}
    const backoffTime = initialInterval * 2 ** i;
    const jitter = Math.round(Math.random() * 1000); // Add some randomness to prevent synchronized retries
    await new Promise((resolve) => setTimeout(resolve, backoffTime + jitter));
  }
}
