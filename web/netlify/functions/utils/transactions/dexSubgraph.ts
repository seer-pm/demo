import { gnosis } from "@/lib/chains";
import type { MarketDataMapping, SupportedChain } from "@seer-pm/sdk";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@seer-pm/sdk/subgraph";
import { getSdk as getSwaprSdk } from "@seer-pm/sdk/subgraph/swapr";
import { getSdk as getUniswapSdk } from "@seer-pm/sdk/subgraph/uniswap";

export function getDexSubgraph(chainId: SupportedChain) {
  const client = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);
  if (!client) {
    throw new Error("Subgraph not available");
  }
  return { client, sdk: chainId === gnosis.id ? getSwaprSdk : getUniswapSdk };
}

export function mappingTokenIds(mappings: MarketDataMapping): string[] {
  return [...mappings.allTokensIds];
}
