import { SUPPORTED_CHAINS } from "@/lib/chains";
import { getAllFactoryAddressesForProfile } from "@seer-pm/sdk";
import type { Market, SupportedChain } from "@seer-pm/sdk";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import type { Address } from "viem";
import { gnosis, mainnet } from "viem/chains";
import { type LegacySubgraphMarket, MARKET_DB_FIELDS, mapGraphMarketFromDbResult } from "../markets";
import type { Database, Json } from "../supabase";
import { withRetry } from "../withRetry";
import { getAllTokens } from "./getAllTokens";
import { type LiquidityEvent, getAllLiquidityEvents, getLiquidityBalancesAtTimestamp } from "./getLiquidityBalances";
import { type PoHRequest, getPOHVerifiedUsers, isPOHVerifiedUserAtTime } from "./getPOHVerifiedUsers";
import type { PoolHourData } from "./getPoolHourDatas";
import { computePrices, fetchPoolHourDatas } from "./getPrices";
import { getTokensByTimestamp } from "./utils";

const supabase: SupabaseClient<Database> = createClient<Database>(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_API_KEY!,
);

export const SEER_PER_DAY = 200000000 / 30;

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
};

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
  const { data, error } = await supabase.rpc("get_direct_holdings_at", {
    p_chain_id: chainId,
    p_timestamp: timestamp,
  });
  if (error) {
    throw error;
  }
  return (data ?? []) as { owner: string; token: string; balance: number }[];
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
  const poolHourDatas = await fetchPoolHourDatas(chainId);
  console.log({
    chainId,
    markets: markets.length,
    tokens: tokens.length,
    liquidityEvents: liquidityEvents.length,
    poolHourDatas: poolHourDatas.length,
    elapsedMs: Date.now() - startedAt,
    rssMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
  });
  return { chainId, markets, tokens, liquidityEvents, poolHourDatas };
}

/** Running per-timestamp totals used to compute each user's share once every chain has folded in. */
type PerTsAccumulator = {
  total: number;
  pohTotal: number;
  userHoldingsAcrossChains: {
    [address: string]: { directHolding: number; indirectHolding: number; chainIds: Set<number> };
  };
};

function createAccumulator(): PerTsAccumulator {
  return { total: 0, pohTotal: 0, userHoldingsAcrossChains: {} };
}

/**
 * Folds one chain's per-user holdings (for a single timestamp) into the running cross-chain
 * accumulator for that timestamp. Mirrors the first pass of the old `distributeAirdropAtTimestamp`:
 * `total`/`pohTotal` are accumulated per chain-user pair (addition is commutative, so this is
 * equivalent regardless of chain iteration order), while `userHoldingsAcrossChains` merges a user's
 * holdings across chains for the final per-user output.
 */
function foldChainUsersIntoAccumulator(
  acc: PerTsAccumulator,
  users: Awaited<ReturnType<typeof computeChainUsersAtTimestamp>>,
  requestsGnosis: PoHRequest[],
  requestsMainnet: PoHRequest[],
  timestamp: number,
) {
  for (const [holderAddress, holderData] of Object.entries(users)) {
    if (!acc.userHoldingsAcrossChains[holderAddress]) {
      acc.userHoldingsAcrossChains[holderAddress] = { directHolding: 0, indirectHolding: 0, chainIds: new Set() };
    }
    const totalHoldingPerUser = (holderData.directHolding ?? 0) + (holderData.indirectHolding ?? 0);
    const isPOHUser =
      isPOHVerifiedUserAtTime(requestsMainnet, holderAddress, timestamp) ||
      isPOHVerifiedUserAtTime(requestsGnosis, holderAddress, timestamp);
    acc.total += totalHoldingPerUser;
    if (isPOHUser) {
      acc.pohTotal += Math.sqrt(totalHoldingPerUser);
    }
    acc.userHoldingsAcrossChains[holderAddress].directHolding += holderData.directHolding ?? 0;
    acc.userHoldingsAcrossChains[holderAddress].indirectHolding += holderData.indirectHolding ?? 0;
    acc.userHoldingsAcrossChains[holderAddress].chainIds.add(holderData.chainId);
  }
}

/** Turns a fully-folded per-timestamp accumulator into the final per-user airdrop records. */
function finalizeDistribution(
  acc: PerTsAccumulator,
  requestsGnosis: PoHRequest[],
  requestsMainnet: PoHRequest[],
  timestamp: number,
) {
  const { total, pohTotal, userHoldingsAcrossChains } = acc;
  const finalData: {
    address: string;
    isPOHUser: boolean;
    timestamp: number;
    totalHolding: number;
    directHolding: number;
    indirectHolding: number;
    shareOfHolding: number;
    shareOfHoldingPoh: number;
    seerTokens: number;
    chainIds: number[];
  }[] = [];
  for (const [holderAddress, holderData] of Object.entries(userHoldingsAcrossChains)) {
    const totalHoldingPerUser = (holderData.directHolding ?? 0) + (holderData.indirectHolding ?? 0);

    if (totalHoldingPerUser.toLocaleString() !== "0") {
      const isPOHUser =
        isPOHVerifiedUserAtTime(requestsMainnet, holderAddress, timestamp) ||
        isPOHVerifiedUserAtTime(requestsGnosis, holderAddress, timestamp);
      const shareOfHolding = totalHoldingPerUser / total;
      const shareOfHoldingPoh = isPOHUser ? Math.sqrt(totalHoldingPerUser) / pohTotal : 0;
      const seerTokens = SEER_PER_DAY * (shareOfHolding * 0.25 + shareOfHoldingPoh * 0.25);
      finalData.push({
        address: holderAddress,
        isPOHUser,
        timestamp,
        totalHolding: totalHoldingPerUser,
        directHolding: holderData.directHolding ?? 0,
        indirectHolding: holderData.indirectHolding ?? 0,
        shareOfHolding,
        shareOfHoldingPoh,
        seerTokens,
        chainIds: Array.from(holderData.chainIds),
      });
    }
  }
  return finalData;
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
 */
export async function computeAirdropForTimestamps(
  timestamps: number[],
  opts?: { budgetMs?: number; startedAt?: number },
): Promise<Map<number, ReturnType<typeof finalizeDistribution>>> {
  const requestsGnosis = await getPOHVerifiedUsers(gnosis.id);
  const requestsMainnet = await getPOHVerifiedUsers(mainnet.id);

  const accumulators = new Map<number, PerTsAccumulator>();
  for (const ts of timestamps) {
    accumulators.set(ts, createAccumulator());
  }

  const startedAt = opts?.startedAt ?? Date.now();
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

    for (const ts of timestamps) {
      const users = await computeChainUsersAtTimestamp(inputs!, ts);
      foldChainUsersIntoAccumulator(accumulators.get(ts)!, users, requestsGnosis, requestsMainnet, ts);
    }
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

/** Raw token units are 18-decimal on-chain amounts (matches `formatUnits(balance, 18)` previously). */
const WEI_PER_TOKEN = 1e18;

/**
 * Per-user holdings for one chain at `timestamp`:
 *  - directHolding: USD value of outcome tokens held directly, aggregated in Postgres via
 *    `get_direct_holdings_at` rather than replaying the chain's full transfer history here.
 *  - indirectHolding: USD value of liquidity provided (from mint/burn events, held in memory —
 *    liquidity event counts are orders of magnitude smaller than transfer counts).
 */
async function computeChainUsersAtTimestamp(inputs: ChainSnapshotInputs, timestamp: number) {
  const { chainId, markets, tokens, liquidityEvents, poolHourDatas } = inputs;
  const tokensByTimestamp = getTokensByTimestamp(markets, timestamp);
  const processedPrices = computePrices(poolHourDatas, tokens, timestamp);
  const directHoldings = await getDirectHoldingsAt(chainId, timestamp);
  const liquidityHoldersAtTimestamp = getLiquidityBalancesAtTimestamp(liquidityEvents, timestamp);

  const users: {
    [key: string]: { directHolding: number; indirectHolding: number; chainId: SupportedChain };
  } = {};
  const initialUser = { directHolding: 0, indirectHolding: 0, chainId };

  for (const { owner: holderAddress, token: tokenId, balance } of directHoldings) {
    if (!tokensByTimestamp[tokenId as Address]) {
      continue;
    }
    if (!users[holderAddress]) {
      users[holderAddress] = { ...initialUser };
    }
    users[holderAddress]["directHolding"] += (processedPrices[tokenId] ?? 0) * (balance / WEI_PER_TOKEN);
  }
  Object.entries(liquidityHoldersAtTimestamp).map(([holderAddress, tokenBalanceMapping]) => {
    if (!users[holderAddress]) {
      users[holderAddress] = { ...initialUser };
    }
    users[holderAddress]["indirectHolding"] =
      (users[holderAddress]["indirectHolding"] ?? 0) +
      Object.entries(tokenBalanceMapping).reduce((acc, [tokenId, tokenBalance]) => {
        if (!tokensByTimestamp[tokenId as Address]) {
          return acc;
        }
        return acc + (processedPrices[tokenId] ?? 0) * tokenBalance;
      }, 0);
  });
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
