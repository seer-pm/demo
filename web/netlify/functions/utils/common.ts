import { SupportedChain, sepolia } from "@/lib/chains";
import { getPublicClient } from "@wagmi/core";
import { Address } from "viem";
import { config } from "./config";

export const S_DAI_ADAPTER = "0xD499b51fcFc66bd31248ef4b28d656d67E591A94";

export const liquidityManagerAddressMapping: Partial<Record<SupportedChain, Address>> = {
  100: "0x031778c7A1c08787aba7a2e0B5149fEb5DECabD7",
};

export const FROM_EMAIL = "gen@seer.pm";

export function getPublicClientForNetwork(networkId: SupportedChain) {
  return getPublicClient(config, { chainId: networkId });
}

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
  return Number(priceString);
}
