import type { SupportedChain } from "@seer-pm/sdk";
import { getMarketPoolsPairs } from "@seer-pm/sdk/market-pools";
import type { Market } from "@seer-pm/sdk/market-types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchPools } from "./fetchPools";
import { type LegacySubgraphMarket, MARKET_DB_FIELDS, mapGraphMarketFromDbResult } from "./markets";
import type { Database } from "./supabase";
import { type TtlCacheEntry, evictExpiredAndOldest } from "./ttlCache";

const POOLS_CACHE_TTL_MS = 15 * 60 * 1000;
const POOLS_CACHE_MAX_SIZE = 8;
const MARKET_PAGE_SIZE = 1000;

const poolsCache = new Map<string, TtlCacheEntry<Set<string>>>();

async function loadMarketsForChain(supabase: SupabaseClient<Database>, chainId: number): Promise<Market[]> {
  const markets: Market[] = [];
  for (let from = 0; ; from += MARKET_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("markets")
      .select(MARKET_DB_FIELDS)
      .eq("chain_id", chainId)
      .not("subgraph_data", "is", null)
      .order("id", { ascending: true })
      .range(from, from + MARKET_PAGE_SIZE - 1);

    if (error) throw new Error(`markets unavailable: ${error.message}`);
    const rows = data ?? [];
    for (const row of rows) {
      try {
        markets.push(mapGraphMarketFromDbResult(row.subgraph_data as LegacySubgraphMarket, row));
      } catch {
        // A malformed row costs one market's pools, not the whole exclusion set.
      }
    }
    if (rows.length < MARKET_PAGE_SIZE) break;
  }
  return markets;
}

/**
 * Every AMM pool on `chainId` that quotes a Seer outcome token, lowercased.
 *
 * This is the exclusion set the outcome-token candidate scan is built on, so its failure mode is
 * what matters. `fetchOutcomeTokenPoolCounterparties` only accepts a wallet when the *other* side of
 * its transfer is in this set, which means a pool missing from the set costs a candidate and can
 * never turn a pool into one. An empty set therefore disables the scan rather than opening it, and
 * that is the behaviour we want when the subgraph is down.
 *
 * Derived from the chain's markets rather than from bytecode probing, the same way
 * `getLiquidityHolders` derives it (`marketLiquidityHolders.ts`): `getMarketPoolsPairs` gives the
 * (outcome, collateral) pairs of every market and `fetchPools` asks the DEX subgraph which of them
 * are deployed. Cached for 15 minutes because the refresh job walks a whole chain per invocation.
 */
export function chainPoolAddressSet(supabase: SupabaseClient<Database>, chainId: SupportedChain): Promise<Set<string>> {
  const key = String(chainId);
  const now = Date.now();
  const existing = poolsCache.get(key);
  if (existing && existing.expiresAt > now) return existing.promise;
  poolsCache.delete(key);
  evictExpiredAndOldest(poolsCache, now, POOLS_CACHE_MAX_SIZE);

  const promise = loadChainPoolAddresses(supabase, chainId).catch((error) => {
    poolsCache.delete(key);
    throw error;
  });
  poolsCache.set(key, { promise, expiresAt: now + POOLS_CACHE_TTL_MS });
  return promise;
}

async function loadChainPoolAddresses(
  supabase: SupabaseClient<Database>,
  chainId: SupportedChain,
): Promise<Set<string>> {
  const markets = await loadMarketsForChain(supabase, chainId);
  const pairs = markets.flatMap((market) => getMarketPoolsPairs(market));
  if (pairs.length === 0) return new Set();

  const pools = await fetchPools(chainId, pairs);
  return new Set(pools.map((pool) => pool.id.toLowerCase()));
}

/** Test seam: the 15-minute memo would otherwise leak one case's pools into the next. */
export function clearChainPoolAddressCache(): void {
  poolsCache.clear();
}
