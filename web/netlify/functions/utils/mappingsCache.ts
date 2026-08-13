import { createHash } from "node:crypto";
import type { MarketDataMapping, SupportedChain } from "@seer-pm/sdk";
import { getMappings } from "@seer-pm/sdk";
import type { Market } from "@seer-pm/sdk/market-types";
import type { PublicClient } from "viem";

const MAPPINGS_CACHE_TTL_MS = 15 * 60 * 1000;
const MAPPINGS_CACHE_MAX_SIZE = 64;

type CacheEntry = {
  promise: Promise<MarketDataMapping>;
  expiresAt: number;
};

/** Per-invocation cache: chainId + hashed sorted market ids → mappings. */
const mappingsCache = new Map<string, CacheEntry>();

function mappingsCacheKey(chainId: number, markets: Market[]): string {
  const ids = markets
    .map((m) => m.id.toLowerCase())
    .sort()
    .join(",");
  const digest = createHash("sha1").update(ids).digest("hex");
  return `${chainId}:${digest}`;
}

function evictExpiredAndOldest(now: number): void {
  for (const [key, entry] of mappingsCache) {
    if (entry.expiresAt <= now) mappingsCache.delete(key);
  }
  while (mappingsCache.size >= MAPPINGS_CACHE_MAX_SIZE) {
    const oldest = mappingsCache.keys().next().value;
    if (oldest === undefined) break;
    mappingsCache.delete(oldest);
  }
}

/**
 * `getMappings` memoized for the current process/invocation.
 * Leaderboard refresh calls this once per wallet×markets set; caching avoids repeat RPC work.
 * Rejected promises are dropped so later callers retry. Entries expire after 15 minutes.
 */
export function getMappingsCached(
  publicClient: PublicClient,
  markets: Market[],
  chainId: SupportedChain,
): Promise<MarketDataMapping> {
  const key = mappingsCacheKey(chainId, markets);
  const now = Date.now();
  const existing = mappingsCache.get(key);
  if (existing && existing.expiresAt > now) {
    return existing.promise;
  }
  mappingsCache.delete(key);
  evictExpiredAndOldest(now);

  const promise = getMappings(publicClient, markets, chainId).catch((error) => {
    mappingsCache.delete(key);
    throw error;
  });
  mappingsCache.set(key, { promise, expiresAt: now + MAPPINGS_CACHE_TTL_MS });
  return promise;
}
