import { sepolia } from "@/lib/chains";
import type { SupportedChain } from "@seer-pm/sdk";
import type { Address } from "viem";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
} as const;

export const S_DAI_ADAPTER = "0xD499b51fcFc66bd31248ef4b28d656d67E591A94";

export const liquidityManagerAddressMapping: Partial<Record<SupportedChain, Address>> = {
  100: "0x031778c7A1c08787aba7a2e0B5149fEb5DECabD7",
};

export const FROM_EMAIL = "gen@seer.pm";

export async function getDexScreenerPriceUSD(token: Address, chainId: SupportedChain): Promise<number> {
  if (chainId === sepolia.id) {
    return 0;
  }
  const data = (await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`).then((res) => res.json())) as {
    pairs: { chainId: string; priceUsd: string }[];
  };
  const priceString = data.pairs?.find(
    (x) => x.chainId === { 1: "ethereum", 100: "gnosischain", 10: "optimism", 8453: "base" }[chainId],
  )?.priceUsd;
  return priceString ? Number(priceString) : 0;
}
