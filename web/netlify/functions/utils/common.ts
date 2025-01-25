import { getPublicClient, getTransactionReceipt, waitForTransactionReceipt } from "@wagmi/core";
import * as postmark from "postmark";
import {
  Address,
  TransactionNotFoundError,
  TransactionReceiptNotFoundError,
  WaitForTransactionReceiptTimeoutError,
} from "viem";
import { config } from "./config";
import { isOdd } from "../../../src/lib/market";
import { SupportedChain } from "../../../src/lib/chains";

export function getMarketEstimate(odds: number[], lowerBound: bigint, upperBound: bigint) {
  if (!isOdd(odds[0]) || !isOdd(odds[1])) {
    return "NA";
  }
  return ((odds[0] * Number(lowerBound) + odds[1] * Number(upperBound)) / 100).toFixed(2);
}

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

export function getPublicClientForNetwork(networkId: SupportedChain) {
  return getPublicClient(config, { chainId: networkId });
}

export function getPostmarkClient() {
  return new postmark.ServerClient(process.env.POSTMARK_API_TOKEN!);
}

export async function getDexScreenerPriceUSD(token: Address, chainId: SupportedChain) {
  const data = (await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`).then((res) => res.json())) as {
    pairs: { chainId: string; priceUsd: string }[];
  };
  const priceString = data.pairs.find((x) => x.chainId === { 1: "ethereum", 100: "gnosischain" }[chainId])?.priceUsd;
  return Number(priceString);
}
