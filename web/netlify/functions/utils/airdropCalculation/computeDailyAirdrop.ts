import { SUPPORTED_CHAINS } from "@/lib/chains";
import { getAllFactoryAddressesForProfile } from "@seer-pm/sdk";
import type { Market, SupportedChain, TokenTransfer } from "@seer-pm/sdk";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import type { Address } from "viem";
import { gnosis, mainnet } from "viem/chains";
import { type LegacySubgraphMarket, MARKET_DB_FIELDS, mapGraphMarketFromDbResult } from "../markets";
import type { Database, Json } from "../supabase";
import { getAllTokens } from "./getAllTokens";
import { getAllTransfers, getHoldersAtTimestamp } from "./getAllTransfers";
import { type LiquidityEvent, getAllLiquidityEvents, getLiquidityBalancesAtTimestamp } from "./getLiquidityBalances";
import { type PoHRequest, getPOHVerifiedUsers, isPOHVerifiedUserAtTime } from "./getPOHVerifiedUsers";
import type { PoolHourData } from "./getPoolHourDatas";
import { computePrices, fetchPoolHourDatas } from "./getPrices";
import { getTokensByTimestamp, withRetry } from "./utils";

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

/** Full, timestamp-independent history for one chain, fetched once and reused for every day. */
type ChainSnapshotInputs = {
  chainId: SupportedChain;
  markets: Market[];
  tokens: TokenInfo[];
  transfers: TokenTransfer[];
  liquidityEvents: LiquidityEvent[];
  poolHourDatas: PoolHourData[];
};

/** All inputs needed to compute the airdrop for any timestamp, fetched once up front. */
export type AirdropInputs = {
  requestsGnosis: PoHRequest[];
  requestsMainnet: PoHRequest[];
  inputsByChain: ChainSnapshotInputs[];
};

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
  console.log("LOADING CHAIN INPUTS", { chainId });
  const markets = await loadDefaultProfileMarkets(chainId);
  const tokens = getAllTokens(markets);
  const transfers = (await getAllTransfers(chainId)).sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
  const liquidityEvents = await getAllLiquidityEvents(chainId, tokens);
  const poolHourDatas = await fetchPoolHourDatas(chainId);
  console.log({
    chainId,
    markets: markets.length,
    tokens: tokens.length,
    transfers: transfers.length,
    liquidityEvents: liquidityEvents.length,
    poolHourDatas: poolHourDatas.length,
  });
  return { chainId, markets, tokens, transfers, liquidityEvents, poolHourDatas };
}

/**
 * Loads everything needed to distribute the airdrop for any timestamp. Proof-of-Humanity only
 * exists on Ethereum and Gnosis, so it is fetched from those two chains only. Call this once and
 * reuse the result across many `distributeAirdropAtTimestamp` calls (backfill), or per invocation
 * for a single day (scheduled function).
 */
export async function loadAirdropInputs(): Promise<AirdropInputs> {
  const requestsGnosis = await getPOHVerifiedUsers(gnosis.id);
  const requestsMainnet = await getPOHVerifiedUsers(mainnet.id);

  // Sequential per chain to bound memory / subgraph load (each chain pulls full history).
  const inputsByChain: ChainSnapshotInputs[] = [];
  for (const chainId of AIRDROP_CHAINS) {
    inputsByChain.push(await loadChainInputs(chainId));
  }
  return { requestsGnosis, requestsMainnet, inputsByChain };
}

/**
 * Per-user holdings for one chain at `timestamp`, computed purely in memory from pre-fetched inputs:
 *  - directHolding: USD value of outcome tokens held directly (from transfers).
 *  - indirectHolding: USD value of liquidity provided (from mint/burn events).
 */
function computeChainUsersAtTimestamp(inputs: ChainSnapshotInputs, timestamp: number) {
  const { chainId, markets, tokens, transfers, liquidityEvents, poolHourDatas } = inputs;
  const tokensByTimestamp = getTokensByTimestamp(markets, timestamp);
  const processedPrices = computePrices(poolHourDatas, tokens, timestamp);
  const holdersAtTimestamp = getHoldersAtTimestamp(transfers, timestamp);
  const liquidityHoldersAtTimestamp = getLiquidityBalancesAtTimestamp(liquidityEvents, timestamp);

  const users: {
    [key: string]: { directHolding: number; indirectHolding: number; chainId: SupportedChain };
  } = {};
  const initialUser = { directHolding: 0, indirectHolding: 0, chainId };

  Object.entries(holdersAtTimestamp).map(([holderAddress, tokenBalanceMapping]) => {
    if (!users[holderAddress]) {
      users[holderAddress] = { ...initialUser };
    }
    users[holderAddress]["directHolding"] =
      (users[holderAddress]["directHolding"] ?? 0) +
      Object.entries(tokenBalanceMapping).reduce((acc, [tokenId, tokenBalance]) => {
        if (!tokensByTimestamp[tokenId as Address]) {
          return acc;
        }
        return acc + (processedPrices[tokenId] ?? 0) * tokenBalance;
      }, 0);
  });
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

/**
 * Computes the airdrop distribution for `timestamp` from pre-loaded `inputs`, merging a user's
 * holdings across all chains. Pure/in-memory — safe to call repeatedly for a backfill.
 */
export function distributeAirdropAtTimestamp(inputs: AirdropInputs, timestamp: number) {
  const { requestsGnosis, requestsMainnet, inputsByChain } = inputs;
  const usersByChain = inputsByChain.map((chainInputs) => computeChainUsersAtTimestamp(chainInputs, timestamp));

  const finalData = [];
  const userHoldingsAcrossChains: {
    [key: string]: { directHolding: number; indirectHolding: number; chainIds: Set<number> };
  } = {};
  let total = 0;
  let pohTotal = 0;
  for (const users of usersByChain) {
    for (const [holderAddress, holderData] of Object.entries(users)) {
      if (!userHoldingsAcrossChains[holderAddress]) {
        userHoldingsAcrossChains[holderAddress] = {
          directHolding: 0,
          indirectHolding: 0,
          chainIds: new Set(),
        };
      }
      const totalHoldingPerUser = (holderData.directHolding ?? 0) + (holderData.indirectHolding ?? 0);
      const isPOHUser =
        isPOHVerifiedUserAtTime(requestsMainnet, holderAddress, timestamp) ||
        isPOHVerifiedUserAtTime(requestsGnosis, holderAddress, timestamp);
      total += totalHoldingPerUser;
      if (isPOHUser) {
        pohTotal += Math.sqrt(totalHoldingPerUser);
      }
      userHoldingsAcrossChains[holderAddress].directHolding += holderData.directHolding ?? 0;
      userHoldingsAcrossChains[holderAddress].indirectHolding += holderData.indirectHolding ?? 0;
      userHoldingsAcrossChains[holderAddress].chainIds.add(holderData.chainId);
    }
  }
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

/** Persists a computed day via the `insert_airdrop_safely` RPC (inserts records + advances `airdrop_state`). */
export async function insertAirdropRecords(
  timestamp: number,
  finalData: ReturnType<typeof distributeAirdropAtTimestamp>,
) {
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
