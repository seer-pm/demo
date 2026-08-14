import { gnosis, optimism, sepolia } from "@/lib/chains";
import type { SupportedChain } from "@seer-pm/sdk";
import { TOKENS_BY_CHAIN } from "@seer-pm/sdk/collateral";
import type { Address } from "viem";
import { formatUnits } from "viem";
import { fetchSUSDSPriceFromContract } from "./fetchSUSDSPriceFromContract";
import { convertFromSDAI } from "./sdai";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
} as const;

export const S_DAI_ADAPTER = "0xD499b51fcFc66bd31248ef4b28d656d67E591A94";

export const liquidityManagerAddressMapping: Partial<Record<SupportedChain, Address>> = {
  100: "0x031778c7A1c08787aba7a2e0B5149fEb5DECabD7",
};

export const FROM_EMAIL = "gen@seer.pm";

/**
 * Spot USD for a token. DexScreener no longer covers Gnosis; for Gnosis sDAI we use
 * on-chain ERC-4626 `convertToAssets` (wxDAI ≈ $1). For Optimism sUSDS we use Spark
 * PSM3 `previewSwapExactIn` (USDS ≈ $1).
 */
export async function getDexScreenerPriceUSD(token: Address, chainId: SupportedChain): Promise<number> {
  if (chainId === sepolia.id) {
    return 0;
  }

  const gnosisSdai = TOKENS_BY_CHAIN[gnosis.id].sDAI;
  if (chainId === gnosis.id && token.toLowerCase() === gnosisSdai.toLowerCase()) {
    const assets = await convertFromSDAI(chainId, 10n ** 18n);
    return Number(formatUnits(assets, 18));
  }

  const optimismSusds = TOKENS_BY_CHAIN[optimism.id].sUSDS;
  if (chainId === optimism.id && token.toLowerCase() === optimismSusds.toLowerCase()) {
    return fetchSUSDSPriceFromContract(chainId);
  }

  try {
    const data = (await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`, {
      signal: AbortSignal.timeout(8_000),
    }).then((res) => res.json())) as {
      pairs: { chainId: string; priceUsd: string }[];
    };
    const priceString = data.pairs?.find(
      (x) => x.chainId === { 1: "ethereum", 100: "gnosischain", 10: "optimism", 8453: "base" }[chainId],
    )?.priceUsd;
    return priceString ? Number(priceString) : 0;
  } catch {
    return 0;
  }
}
