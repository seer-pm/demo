import { config } from "@/wagmiConfig";
import { type Market, type MarketDataMapping, type SupportedChain, getMappings as getMappingsSdk } from "@seer-pm/sdk";
import { getPublicClient } from "@wagmi/core";

export type { MarketDataMapping };

export async function getMappings(initialMarkets: Market[], chainId: SupportedChain): Promise<MarketDataMapping> {
  const client = getPublicClient(config, { chainId }) as Parameters<typeof getMappingsSdk>[0];
  return getMappingsSdk(client, initialMarkets, chainId);
}
