import { getPublicClient, getTransactionReceipt, waitForTransactionReceipt } from "@wagmi/core";
import * as postmark from "postmark";
import {
  Address,
  TransactionNotFoundError,
  TransactionReceiptNotFoundError,
  WaitForTransactionReceiptTimeoutError,
} from "viem";
import { SupportedChain, config } from "./config";
import { Market, Token0Token1 } from "./types";

// biome-ignore lint/suspicious/noExplicitAny:
export const isUndefined = (maybeObject: any): maybeObject is undefined | null => {
  return typeof maybeObject === "undefined" || maybeObject === null;
};

export function bigIntMax(...args: bigint[]): bigint {
  if (!args.length) return 0n;
  return args.reduce((m, e) => (e > m ? e : m));
}

export function isTwoStringsEqual(str1: string | undefined | null, str2: string | undefined | null) {
  return str1?.trim() && str2?.trim()?.toLocaleLowerCase() === str1?.trim()?.toLocaleLowerCase();
}

export function isOdd(odd: number | undefined | null) {
  return typeof odd === "number" && !Number.isNaN(odd) && !isUndefined(odd);
}

export function getMarketEstimate(odds: number[], lowerBound: bigint, upperBound: bigint) {
  if (!isOdd(odds[0]) || !isOdd(odds[1])) {
    return "NA";
  }
  return ((odds[0] * Number(lowerBound) + odds[1] * Number(upperBound)) / 100).toFixed(2);
}

export function unescapeJson(txt: string) {
  return txt.replace(/\\"/g, '"');
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

export function getCollateralByIndex(market: Market, index: number) {
  if (market.type === "Generic") {
    return market.collateralToken;
  }
  return index < 2 ? market.collateralToken1 : market.collateralToken2;
}

// outcome0 pairs with outcome2
// outcome1 pairs with outcome3
// outcome2 pairs with outcome0
// outcome3 pairs with outcome1
export const FUTARCHY_LP_PAIRS_MAPPING = [2, 3, 0, 1];

export function getLiquidityPair(market: Market, outcomeIndex: number): Token0Token1 {
  if (market.type === "Generic") {
    return getToken0Token1(market.wrappedTokens[outcomeIndex], market.collateralToken);
  }

  return getToken0Token1(
    market.wrappedTokens[outcomeIndex],
    market.wrappedTokens[FUTARCHY_LP_PAIRS_MAPPING[outcomeIndex]],
  );
}

export function getLiquidityPairForToken(market: Market, outcomeIndex: number): Address {
  if (market.type === "Generic") {
    return market.collateralToken;
  }

  return market.wrappedTokens[FUTARCHY_LP_PAIRS_MAPPING[outcomeIndex]];
}

export function getMarketPoolsPairs(market: Market): Token0Token1[] {
  const pools = new Set<Token0Token1>();
  const tokens = market.type === "Generic" ? market.wrappedTokens : market.wrappedTokens.slice(0, 2);
  tokens.forEach((_, index) => {
    pools.add(getLiquidityPair(market, index));
  });
  return [...pools];
}

export function getToken0Token1(token0: Address, token1: Address): Token0Token1 {
  return token0.toLocaleLowerCase() > token1.toLocaleLowerCase()
    ? { token0: token1.toLocaleLowerCase() as Address, token1: token0.toLocaleLowerCase() as Address }
    : { token0: token0.toLocaleLowerCase() as Address, token1: token1.toLocaleLowerCase() as Address };
}

export async function getDexScreenerPriceUSD(token: Address, chainId: SupportedChain) {
  const data = (await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`).then((res) => res.json())) as {
    pairs: { chainId: string; priceUsd: string }[];
  };
  const priceString = data.pairs.find((x) => x.chainId === { 1: "ethereum", 100: "gnosischain" }[chainId])?.priceUsd;
  return Number(priceString);
}
