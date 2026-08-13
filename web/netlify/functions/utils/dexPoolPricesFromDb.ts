import type { PortfolioPosition } from "@seer-pm/sdk";
import type { SupportedChain } from "@seer-pm/sdk";
import { getToken0Token1 } from "@seer-pm/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Address } from "viem";
import { getTokenPricesMapping } from "./portfolio";
import type { Database } from "./supabase";

/** Same window as the former subgraph `GetPoolHourDatas` query (~3 months). */
const HISTORY_LOOKBACK_SECONDS = 60 * 60 * 24 * 30 * 3;

/** Keep pair RPC payloads small enough to avoid statement timeouts. */
const PAIR_RPC_CHUNK = 80;

type PoolPriceRow = {
  token0: { id: string };
  token1: { id: string };
  token0Price: string;
  token1Price: string;
};

type PairArrays = { token0Ids: string[]; token1Ids: string[] };

function dedupePositionsForPoolHourQuery(positions: PortfolioPosition[]): PortfolioPosition[] {
  const seen = new Set<string>();
  const out: PortfolioPosition[] = [];
  for (const p of positions) {
    const key = `${p.tokenId.toLowerCase()}:${(p.collateralToken ?? "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

function positionsToPairArrays(positions: PortfolioPosition[]): PairArrays {
  const unique = dedupePositionsForPoolHourQuery(positions);
  const token0Ids: string[] = [];
  const token1Ids: string[] = [];
  for (const pos of unique) {
    const { token0, token1 } = getToken0Token1(pos.tokenId as Address, pos.collateralToken as Address);
    token0Ids.push(token0.toLowerCase());
    token1Ids.push(token1.toLowerCase());
  }
  return { token0Ids, token1Ids };
}

function chunkPairArrays(pairs: PairArrays, size: number): PairArrays[] {
  const out: PairArrays[] = [];
  for (let i = 0; i < pairs.token0Ids.length; i += size) {
    out.push({
      token0Ids: pairs.token0Ids.slice(i, i + size),
      token1Ids: pairs.token1Ids.slice(i, i + size),
    });
  }
  return out;
}

function mapRpcRowsToPoolPriceRows(
  rows: {
    token0_id: string;
    token1_id: string;
    token0_price: string;
    token1_price: string;
  }[],
): PoolPriceRow[] {
  return rows.map((r) => ({
    token0: { id: r.token0_id },
    token1: { id: r.token1_id },
    token0Price: r.token0_price,
    token1Price: r.token1_price,
  }));
}

/**
 * Latest DEX pool prices from `dex_pool_hour_prices` (one row per pair via `dex_pool_hour_prices_latest_for_pairs`).
 * Only positions with a non-zero balance are priced (zero value does not need a quote).
 */
export async function getCurrentTokensPricesForPortfolio(
  supabase: SupabaseClient<Database>,
  positions: PortfolioPosition[],
  chainId: SupportedChain,
): Promise<Record<string, number | undefined>> {
  const withBalance = positions.filter((p) => {
    try {
      return BigInt(p.rawBalance) > 0n;
    } catch {
      return p.tokenBalance > 0;
    }
  });
  if (withBalance.length === 0) {
    return {};
  }

  const pairs = positionsToPairArrays(withBalance);
  if (pairs.token0Ids.length === 0) {
    return getTokenPricesMapping(withBalance, []);
  }

  const poolsAccum: PoolPriceRow[] = [];
  for (const chunk of chunkPairArrays(pairs, PAIR_RPC_CHUNK)) {
    const { data, error } = await supabase.rpc("dex_pool_hour_prices_latest_for_pairs", {
      p_chain_id: chainId,
      p_token0_ids: chunk.token0Ids,
      p_token1_ids: chunk.token1Ids,
    });

    if (error) {
      console.error("dex_pool_hour_prices_latest_for_pairs", error);
      continue;
    }
    if (data?.length) {
      poolsAccum.push(...mapRpcRowsToPoolPriceRows(data));
    }
  }

  return getTokenPricesMapping(withBalance, poolsAccum);
}

/**
 * Nearest hour at or before `startTime` within the lookback window, per pool — mirrors the old subgraph history query.
 */
export async function getHistoryTokensPricesForPortfolio(
  supabase: SupabaseClient<Database>,
  positions: PortfolioPosition[],
  chainId: SupportedChain,
  startTime: number,
): Promise<Record<string, number | undefined>> {
  if (positions.length === 0) {
    return {};
  }

  const pairs = positionsToPairArrays(positions);
  if (pairs.token0Ids.length === 0) {
    return getTokenPricesMapping(positions, []);
  }

  const poolsAccum: PoolPriceRow[] = [];
  for (const chunk of chunkPairArrays(pairs, PAIR_RPC_CHUNK)) {
    const { data: rpcRows, error: rpcError } = await supabase.rpc("dex_pool_hour_prices_nearest_before_for_pairs", {
      p_chain_id: chainId,
      p_start_time: startTime,
      p_lookback_seconds: HISTORY_LOOKBACK_SECONDS,
      p_token0_ids: chunk.token0Ids,
      p_token1_ids: chunk.token1Ids,
    });

    if (rpcError) {
      console.error("dex_pool_hour_prices_nearest_before_for_pairs", rpcError);
      continue;
    }
    if (rpcRows?.length) {
      poolsAccum.push(...mapRpcRowsToPoolPriceRows(rpcRows));
    }
  }

  return getTokenPricesMapping(positions, poolsAccum);
}
