import { SUPPORTED_CHAINS } from "@/lib/chains";
import { getAllFactoryAddressesForProfile } from "@seer-pm/sdk";
import type { Market, SupportedChain } from "@seer-pm/sdk";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import pLimit from "p-limit";
import type { Address } from "viem";
import { gnosis, mainnet } from "viem/chains";
import { type LegacySubgraphMarket, MARKET_DB_FIELDS, mapGraphMarketFromDbResult } from "../markets";
import type { Database, Json } from "../supabase";
import { withRetry } from "../withRetry";
import {
  type PerTsAccumulator,
  createAccumulator,
  finalizeDistribution,
  foldChainUsersIntoAccumulator,
} from "./distribution";
import { getAllTokens } from "./getAllTokens";
import {
  type LiquidityEvent,
  type LiquidityPosition,
  getAllLiquidityEvents,
  getLiquidityPositionsAtTimestamp,
  getPoolAddresses,
} from "./getLiquidityBalances";
import { getPOHVerifiedUsers } from "./getPOHVerifiedUsers";
import { type PoolHourData, getAllPoolHourDatas } from "./getPoolHourDatas";
import { type PoolStateMap, buildPoolStateAt, computePricesFromPoolState } from "./getPrices";
import {
  getAmountsForLiquidity,
  getSqrtRatioAtTickX96,
  getTokensByTimestamp,
  sqrtPriceX96FromToken1Price,
} from "./utils";

const supabase: SupabaseClient<Database> = createClient<Database>(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_API_KEY!,
);

/**
 * Chains the airdrop is computed for. Resolved dynamically from `SUPPORTED_CHAINS`
 * (gnosis, mainnet, optimism, base today) so newly added chains are picked up
 * automatically — matching how `dex-pool-prices-background` iterates chains.
 */
export const AIRDROP_CHAINS = Object.keys(SUPPORTED_CHAINS).map(Number) as SupportedChain[];

type TokenInfo = { tokenId: Address; parentTokenId?: Address; collateralToken: Address };

/**
 * Timestamp-independent history for one chain, fetched once and reused for every day. Direct
 * token holdings are deliberately NOT here — they're computed per-timestamp via the
 * `get_direct_holdings_at` Postgres RPC (see supabase/sql/get_direct_holdings_at.sql) instead of
 * fetching the chain's entire transfer history into this process. A single chain (Gnosis) already
 * has 2.35M+ transfers and grows daily; pulling that into Node memory is what caused the airdrop
 * worker's OOM crashes. Pushing the aggregation into Postgres keeps this function's memory
 * bounded by market/liquidity/price data (tens of thousands of rows) regardless of how large the
 * chain's transfer history grows.
 */
type ChainSnapshotInputs = {
  chainId: SupportedChain;
  markets: Market[];
  tokens: TokenInfo[];
  liquidityEvents: LiquidityEvent[];
  poolHourDatas: PoolHourData[];
  /** @see collectExcludedHolders */
  excludedHolders: Set<string>;
};

/**
 * Addresses that hold outcome tokens on behalf of someone else and must not be credited as direct
 * holders — today, the AMM pool contracts.
 *
 * A pool's reserves are exactly the tokens backing its LP positions, and those are already credited
 * to the LPs as `indirectHolding`. Transfers into a pool are ordinary ERC20 `Transfer` events, so
 * without this the pool address comes back from `get_direct_holdings_at` as a large holder and the
 * same reserves are counted twice: once to the pool, once to its LPs. That inflates `total`,
 * dilutes every real holder's `shareOfHolding`, and allocates a slice of the emission to a contract
 * that can never claim it. Excluded holders are dropped before they reach the accumulator, so they
 * leave both the payout and both denominators — the same discipline as `DUST_HOLDING`.
 *
 * Unioned from two sources because neither is complete alone: `dex_pool_hour_prices.pool_id` covers
 * pools that traded and were ingested, while mint/burn `pool.id` covers every pool that ever
 * received liquidity (a pool with reserves but no trades has no candle).
 */
export function collectExcludedHolders(liquidityEvents: LiquidityEvent[], poolHourDatas: PoolHourData[]): Set<string> {
  const excluded = getPoolAddresses(liquidityEvents);
  for (const entry of poolHourDatas) {
    if (entry.pool?.id) {
      excluded.add(entry.pool.id.toLowerCase());
    }
  }
  return excluded;
}

/**
 * A holder's net token balance (raw, 18-decimal token units) as of `timestamp`, computed in
 * Postgres and returned as a single `jsonb` array (not `TABLE`) — the project's API enforces a
 * "Max Rows" cap (observed: 1000) on any response regardless of requested range, and each round
 * trip through this project's API/pooler costs ~10-12s of connection overhead (the query itself
 * runs in single-digit milliseconds), so a paginated table-returning version would need dozens of
 * round trips per chain (Optimism: ~70k holder/token pairs) and risk exceeding Netlify's time
 * budget on network overhead alone. One `jsonb_agg(...)` result is exactly one row regardless of
 * how many holders it contains, so the whole chain comes back in a single call.
 */
async function getDirectHoldingsAt(
  chainId: SupportedChain,
  timestamp: number,
): Promise<{ owner: string; token: string; balance: number }[]> {
  // Retried like every other loader here. This is the heaviest query in the airdrop path — it
  // aggregates a chain's whole transfer history up to `timestamp`, and measured on Optimism it
  // grows with holder count (0.3s early in the airdrop, ~12s once there are ~70k holder/token
  // pairs, longer still under concurrency). A statement timeout (57014) on any one day was enough
  // to abort a multi-hour backfill and discard every chain already crawled, which is exactly the
  // transient `withRetry` exists for. It was the only Supabase call in this module without it.
  return withRetry(async () => {
    const { data, error } = await supabase.rpc("get_direct_holdings_at", {
      p_chain_id: chainId,
      p_timestamp: timestamp,
    });
    if (error) {
      throw error;
    }
    return (data ?? []) as { owner: string; token: string; balance: number }[];
  }, `holdings.${chainId}`);
}

/**
 * Fetches the entire relevant history for a chain a single time: markets/tokens (current DB
 * state), all outcome-token transfers, all mint/burn liquidity events, and all pool-hour prices.
 * None of this depends on the snapshot timestamp, so a backfill can load it once and then compute
 * many days in memory. Liquidity comes solely from mint/burn events (Uniswap on
 * mainnet/optimism/base, Algebra on gnosis) — no position snapshots / Bunni.
 */
/**
 * Loads default-collateral markets for a chain straight from the base `markets` table
 * (id-paginated, no count/sort). We deliberately avoid `searchAllMarkets`, which hits the heavy
 * `markets_search` view with `count: "exact"` and a multi-column sort — that times out on chains
 * with hundreds of markets (e.g. Optimism). Mirrors `dex-pool-prices-background`'s market load.
 */
async function loadDefaultProfileMarkets(chainId: SupportedChain): Promise<Market[]> {
  // Filter by factory in JS rather than a `subgraph_data->>factory` SQL `in` filter — the JSON
  // filter is slow enough to trip Supabase's statement timeout on larger chains.
  const factories = new Set(getAllFactoryAddressesForProfile("default").map((f) => f.toLowerCase()));
  const pageSize = 1000;
  let from = 0;
  const markets: Market[] = [];
  for (;;) {
    const data = await withRetry(async () => {
      const res = await supabase
        .from("markets")
        .select(MARKET_DB_FIELDS)
        .eq("chain_id", chainId)
        .not("subgraph_data", "is", null)
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1);
      if (res.error) throw res.error;
      return res.data;
    }, "markets.page");
    if (!data?.length) {
      break;
    }
    for (const row of data) {
      try {
        const market = mapGraphMarketFromDbResult(row.subgraph_data as LegacySubgraphMarket, row);
        if (market.factory && factories.has(market.factory.toLowerCase())) {
          markets.push(market);
        }
      } catch {
        /* skip malformed rows */
      }
    }
    if (data.length < pageSize) {
      break;
    }
    from += pageSize;
  }
  return markets;
}

async function loadChainInputs(chainId: SupportedChain): Promise<ChainSnapshotInputs> {
  const startedAt = Date.now();
  console.log("LOADING CHAIN INPUTS", { chainId });
  const markets = await loadDefaultProfileMarkets(chainId);
  const tokens = getAllTokens(markets);
  const liquidityEvents = await getAllLiquidityEvents(chainId, tokens);
  const poolHourDatas = await getAllPoolHourDatas(chainId);
  const excludedHolders = collectExcludedHolders(liquidityEvents, poolHourDatas);
  console.log({
    chainId,
    markets: markets.length,
    tokens: tokens.length,
    liquidityEvents: liquidityEvents.length,
    poolHourDatas: poolHourDatas.length,
    excludedHolders: excludedHolders.size,
    elapsedMs: Date.now() - startedAt,
    rssMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
  });
  return { chainId, markets, tokens, liquidityEvents, poolHourDatas, excludedHolders };
}

/**
 * Computes the airdrop distribution for every timestamp in `timestamps` in a single pass: each
 * chain's market/liquidity/price history is loaded ONCE, folded into every timestamp's running
 * accumulator (direct holdings per timestamp come from the `get_direct_holdings_at` Postgres RPC,
 * not from data loaded here), and then dropped before the next chain loads. Chain data is now
 * markets/liquidity-events/pool-hour-prices only — tens of thousands of rows at most — rather than
 * a chain's entire transfer history (millions of rows for Gnosis and growing daily), which is what
 * previously OOM'd the 1024 MB Netlify function. Streaming one chain at a time and forcing a GC
 * between chains (a no-op unless the process has `--expose-gc`) is kept as defense in depth.
 *
 * A chain that fails to load aborts the whole run (thrown, nothing inserted) rather than silently
 * dropping that chain — `shareOfHolding` is a fraction of the cross-chain total, so a missing chain
 * would corrupt every user's share, not just that chain's users.
 *
 * `concurrency` bounds how many timestamps are computed at once within a chain. It defaults to 1 —
 * strictly sequential, exactly as the scheduled function has always run — and exists for the
 * backfill, which computes hundreds of days rather than one or two. Each day costs one
 * `get_direct_holdings_at` round trip whose ~10-12s is almost entirely connection overhead (the
 * query runs in single-digit milliseconds, see `getDirectHoldingsAt`), so overlapping those waits
 * is close to a linear speedup. It is opt-in because it multiplies peak memory by roughly the
 * concurrency: each in-flight day holds a chain's holdings array (Optimism: ~70k rows) and its own
 * pool-state map. The scheduled function runs in 1024 MB and has one or two days to do, so it gains
 * nothing and must not pay that cost.
 */
export async function computeAirdropForTimestamps(
  timestamps: number[],
  opts?: { budgetMs?: number; startedAt?: number; concurrency?: number },
): Promise<Map<number, ReturnType<typeof finalizeDistribution>>> {
  const requestsGnosis = await getPOHVerifiedUsers(gnosis.id);
  const requestsMainnet = await getPOHVerifiedUsers(mainnet.id);

  const accumulators = new Map<number, PerTsAccumulator>();
  for (const ts of timestamps) {
    accumulators.set(ts, createAccumulator());
  }

  const startedAt = opts?.startedAt ?? Date.now();
  const limit = pLimit(Math.max(1, Math.floor(opts?.concurrency ?? 1)));
  for (const chainId of AIRDROP_CHAINS) {
    if (opts?.budgetMs && Date.now() - startedAt > opts.budgetMs) {
      throw new Error(
        `computeAirdropForTimestamps: load budget (${opts.budgetMs}ms) exceeded before loading chain ${chainId}`,
      );
    }

    let inputs: ChainSnapshotInputs | undefined;
    try {
      inputs = await loadChainInputs(chainId);
    } catch (e) {
      console.error(`Failed loading chain ${chainId} inputs:`, (e as Error)?.stack ?? e);
      throw e;
    }

    // `foldChainUsersIntoAccumulator` writes only to its own timestamp's accumulator, so folding
    // concurrently is safe: two days never touch the same object, and the fold itself is
    // synchronous. Order does not matter either — the fold is addition into a per-address map.
    await Promise.all(
      timestamps.map((ts) =>
        limit(async () => {
          const users = await computeChainUsersAtTimestamp(inputs!, ts);
          foldChainUsersIntoAccumulator(accumulators.get(ts)!, users);
        }),
      ),
    );
    // Drop this chain's data and force a collection before the next chain loads (a no-op unless
    // the process has `--expose-gc`) — defense in depth now that transfers no longer dominate
    // memory, kept in case liquidity-event/pool-hour-price volume grows significantly.
    inputs = undefined;
    (globalThis as { gc?: () => void }).gc?.();
  }

  const result = new Map<number, ReturnType<typeof finalizeDistribution>>();
  for (const ts of timestamps) {
    result.set(ts, finalizeDistribution(accumulators.get(ts)!, requestsGnosis, requestsMainnet, ts));
  }
  return result;
}

/**
 * Raw token units are 18-decimal on-chain amounts.
 *
 * Every token the airdrop values is 18 decimals: outcome tokens are ERC20 wrappers, and every
 * default-profile primary collateral is 18 (sDAI on gnosis/mainnet, sUSDS on optimism/base). The
 * 6-decimal USDC is a swap token only and never backs a market. `sqrtPriceX96FromToken1Price`
 * relies on the same fact, so a non-18-decimal collateral being added to a default profile would
 * break both — hence it is asserted here rather than assumed silently.
 */
const WEI_PER_TOKEN = 1e18;

/**
 * Per-user holdings for one chain at `timestamp`, in COLLATERAL terms (not USD — see the note on
 * `computePricesFromPoolState`):
 *  - directHolding: outcome tokens held directly, aggregated in Postgres via
 *    `get_direct_holdings_at` rather than replaying the chain's full transfer history here.
 *  - indirectHolding: outcome tokens backing the user's concentrated-liquidity positions, valued at
 *    the snapshot price.
 */
async function computeChainUsersAtTimestamp(inputs: ChainSnapshotInputs, timestamp: number) {
  const { chainId, markets, tokens, liquidityEvents, poolHourDatas, excludedHolders } = inputs;
  const tokensByTimestamp = getTokensByTimestamp(markets, timestamp);
  // Built once and shared: prices need it, and so does the LP valuation below, which reads each
  // pool's price back out to reconstruct sqrtPriceX96.
  const poolState = buildPoolStateAt(poolHourDatas, timestamp);
  const processedPrices = computePricesFromPoolState(poolState, tokens);
  const directHoldings = await getDirectHoldingsAt(chainId, timestamp);
  const positions = getLiquidityPositionsAtTimestamp(liquidityEvents, timestamp);

  return buildChainUsers({
    chainId,
    tokensByTimestamp,
    poolState,
    processedPrices,
    directHoldings,
    positions,
    excludedHolders,
  });
}

export type DirectHolding = { owner: string; token: string; balance: number };

/**
 * The pure half of `computeChainUsersAtTimestamp`: everything that does not need a Supabase client,
 * split out so the valuation and the holder exclusion are testable in isolation (same reason
 * `distribution.ts` exists).
 */
export function buildChainUsers({
  chainId,
  tokensByTimestamp,
  poolState,
  processedPrices,
  directHoldings,
  positions,
  excludedHolders,
}: {
  chainId: SupportedChain;
  tokensByTimestamp: { [key: Address]: boolean };
  poolState: PoolStateMap;
  processedPrices: { [tokenId: string]: number };
  directHoldings: DirectHolding[];
  positions: LiquidityPosition[];
  excludedHolders: Set<string>;
}) {
  const users: {
    [key: string]: { directHolding: number; indirectHolding: number; chainId: SupportedChain };
  } = {};
  const initialUser = { directHolding: 0, indirectHolding: 0, chainId };

  for (const { owner: holderAddress, token: tokenId, balance } of directHoldings) {
    if (!tokensByTimestamp[tokenId as Address]) {
      continue;
    }
    // An AMM pool's reserves back its LP positions, which are credited below. Counting the pool as
    // a holder too would count those tokens twice — see `collectExcludedHolders`.
    if (excludedHolders.has(holderAddress.toLowerCase())) {
      continue;
    }
    if (!users[holderAddress]) {
      users[holderAddress] = { ...initialUser };
    }
    users[holderAddress]["directHolding"] += (processedPrices[tokenId] ?? 0) * (balance / WEI_PER_TOKEN);
  }

  for (const position of positions) {
    const poolHourData = poolState.get(position.token0 + position.token1);
    if (!poolHourData) {
      continue; // pool never traded at or before this snapshot; nothing to price it with
    }
    const sqrtCurrent = sqrtPriceX96FromToken1Price(Number(poolHourData.token1Price));
    if (sqrtCurrent <= 0n) {
      continue;
    }
    const { amount0, amount1 } = getAmountsForLiquidity(
      sqrtCurrent,
      getSqrtRatioAtTickX96(position.tickLower),
      getSqrtRatioAtTickX96(position.tickUpper),
      position.liquidity,
    );

    // NOTE the unit change from the model this replaces: the subgraph's amount0/amount1 were
    // already decimal-adjusted, so the old code did NOT divide. These come out of the liquidity
    // math in raw wei, so they must be scaled exactly like directHolding above.
    let value = 0;
    for (const [tokenId, rawAmount] of [
      [position.token0, amount0],
      [position.token1, amount1],
    ] as const) {
      if (rawAmount <= 0n || !tokensByTimestamp[tokenId as Address]) {
        continue; // only the outcome-token side of the pool earns; the collateral side does not
      }
      value += (processedPrices[tokenId] ?? 0) * (Number(rawAmount) / WEI_PER_TOKEN);
    }
    if (value === 0) {
      continue;
    }

    if (!users[position.origin]) {
      users[position.origin] = { ...initialUser };
    }
    users[position.origin]["indirectHolding"] += value;
  }

  return users;
}

/** Persists a computed day via the `insert_airdrop_safely` RPC (inserts records + advances `airdrop_state`). */
export async function insertAirdropRecords(timestamp: number, finalData: ReturnType<typeof finalizeDistribution>) {
  const rpcPayload = {
    new_timestamp: timestamp,
    records: finalData.map((data) => ({
      address: data.address,
      is_poh: data.isPOHUser,
      total_holding: data.totalHolding ?? 0,
      direct_holding: data.directHolding ?? 0,
      indirect_holding: data.indirectHolding ?? 0,
      share_of_holding: data.shareOfHolding ?? 0,
      share_of_holding_poh: data.shareOfHoldingPoh ?? 0,
      seer_tokens_count: data.seerTokens ?? 0,
      chain_ids: data.chainIds,
    })) as unknown as Json,
  };

  const { error } = await supabase.rpc("insert_airdrop_safely", rpcPayload);
  if (error) {
    throw error;
  }
  console.log(`Airdrop inserted safely for timestamp ${timestamp} (${finalData.length} records)`);
}
