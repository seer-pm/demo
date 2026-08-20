import type { SupportedChain } from "@seer-pm/sdk";
import type { Address } from "viem";
import { expandMarketIdsCacheKey } from "./expandMarketIdsCacheKey";
import { searchAllMarkets } from "./markets";

export { expandMarketIdsCacheKey } from "./expandMarketIdsCacheKey";

const EXPAND_MARKETS_CACHE_TTL_MS = 15 * 60 * 1000;
const EXPAND_MARKETS_CACHE_MAX_SIZE = 32;

type ExpandMarketsCacheEntry = {
  ids: Address[];
  expiresAt: number;
};

const expandMarketsCache = new Map<string, ExpandMarketsCacheEntry>();

async function mapPool<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) || 0 }, async () => {
      while (next < items.length) {
        const index = next++;
        await fn(items[index]);
      }
    }),
  );
}

/**
 * App allowlists often list parent session markets; trading activity lives on conditionals.
 * Expand to parents ∪ children (`parentMarket` = each root id).
 * Memoized per process by `(chainId, sorted roots)`.
 */
export async function expandMarketIdsWithChildren(chainId: number, marketIds: Address[]): Promise<Address[]> {
  const roots = [...new Set(marketIds.map((id) => id.toLowerCase() as Address))];
  if (roots.length === 0) return [];

  const key = expandMarketIdsCacheKey(chainId, roots);
  const now = Date.now();
  const cached = expandMarketsCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.ids;
  }

  const expanded = new Set<Address>(roots);
  await mapPool(roots, 3, async (parent) => {
    const { markets } = await searchAllMarkets({
      chainIds: [chainId as SupportedChain],
      parentMarket: parent,
    });
    for (const market of markets) {
      expanded.add(market.id.toLowerCase() as Address);
    }
  });
  const ids = [...expanded];
  expandMarketsCache.set(key, { ids, expiresAt: now + EXPAND_MARKETS_CACHE_TTL_MS });
  while (expandMarketsCache.size > EXPAND_MARKETS_CACHE_MAX_SIZE) {
    const oldest = expandMarketsCache.keys().next().value;
    if (oldest === undefined) break;
    expandMarketsCache.delete(oldest);
  }
  return ids;
}
