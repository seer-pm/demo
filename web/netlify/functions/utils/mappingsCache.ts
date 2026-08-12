import type { MarketDataMapping, SupportedChain } from "@seer-pm/sdk";
import { getMappings } from "@seer-pm/sdk";
import type { Market } from "@seer-pm/sdk/market-types";
import type { PublicClient } from "viem";

/** Per-invocation cache: chainId + sorted market ids → mappings. */
const mappingsCache = new Map<string, Promise<MarketDataMapping>>();

function mappingsCacheKey(chainId: number, markets: Market[]): string {
  const ids = markets
    .map((m) => m.id.toLowerCase())
    .sort()
    .join(",");
  return `${chainId}:${ids}`;
}

/**
 * `getMappings` memoized for the current process/invocation.
 * Leaderboard refresh calls this once per wallet×markets set; caching avoids repeat RPC work.
 */
export function getMappingsCached(
  publicClient: PublicClient,
  markets: Market[],
  chainId: SupportedChain,
): Promise<MarketDataMapping> {
  const key = mappingsCacheKey(chainId, markets);
  let pending = mappingsCache.get(key);
  if (!pending) {
    pending = getMappings(publicClient, markets, chainId);
    mappingsCache.set(key, pending);
  }
  return pending;
}
