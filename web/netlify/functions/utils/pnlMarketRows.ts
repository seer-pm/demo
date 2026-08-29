import type { Address } from "@seer-pm/sdk";
import type { MarketPeriodBucket } from "./marketPeriodBuckets";
import { computeRoiUsd } from "./pnlLeaderboardMetrics";
import { PORTFOLIO_PL_PERIODS, type PortfolioPlPeriod } from "./seerIndexerPortfolio";
import type { TablesInsert } from "./supabase";

export type PnlMarketInsert = TablesInsert<"pnl_market_leaderboard">;
export type PnlLeaderboardInsert = TablesInsert<"pnl_leaderboard">;

/** A bucket carries no information when every number is zero and nothing traded. */
export function isEmptyBucket(bucket: MarketPeriodBucket): boolean {
  return (
    !bucket.traded &&
    bucket.valueStartMtm === 0 &&
    bucket.valueEndMtm === 0 &&
    bucket.routerPrimaryCumStart === 0 &&
    bucket.routerPrimaryCumEnd === 0 &&
    bucket.tradingCollateralNetOut === 0 &&
    bucket.lpCollateralNetOut === 0 &&
    bucket.volume === 0 &&
    bucket.capitalDeployed === 0 &&
    bucket.pnl === 0
  );
}

/**
 * Rows for `pnl_market_leaderboard` from one wallet's per-market buckets.
 *
 * `value_start` / `value_end` are stored as `mtm + routerCum` so they mean the same thing as the
 * columns of the same name in `pnl_leaderboard`; both halves are stored alongside for audit. They
 * are **not** the ROI denominator — that is `capital_deployed` on its own.
 *
 * All-zero buckets are dropped: absent is identical to zero under a `SUM`, and writing them would
 * turn a sparse table into `wallets × every market they ever touched × periods`.
 */
export function buildMarketRows(args: {
  account: Address | string;
  chainId: number;
  byMarketPeriod: Record<PortfolioPlPeriod, MarketPeriodBucket[]>;
  periods: readonly PortfolioPlPeriod[];
  startTimeByPeriod: Record<PortfolioPlPeriod, number>;
  endTime: number;
  collateralPriceUsd: number;
  writtenAt: string;
}): PnlMarketInsert[] {
  const { account, chainId, byMarketPeriod, periods, startTimeByPeriod, endTime, collateralPriceUsd, writtenAt } = args;
  const address = account.toLowerCase();
  const rows: PnlMarketInsert[] = [];

  for (const period of periods) {
    for (const bucket of byMarketPeriod[period] ?? []) {
      if (isEmptyBucket(bucket)) continue;

      const pnl = Number(bucket.pnl) || 0;
      const volume = Number(bucket.volume) || 0;
      const valueStart = (Number(bucket.valueStartMtm) || 0) + (Number(bucket.routerPrimaryCumStart) || 0);
      const valueEnd = (Number(bucket.valueEndMtm) || 0) + (Number(bucket.routerPrimaryCumEnd) || 0);

      rows.push({
        chain_id: chainId,
        address,
        market_id: bucket.marketId.toLowerCase(),
        period,
        pnl,
        pnl_usd: pnl * collateralPriceUsd,
        collateral_price_usd: collateralPriceUsd,
        value_start: valueStart,
        value_end: valueEnd,
        value_start_mtm: Number(bucket.valueStartMtm) || 0,
        value_end_mtm: Number(bucket.valueEndMtm) || 0,
        router_primary_cum_start: Number(bucket.routerPrimaryCumStart) || 0,
        router_primary_cum_end: Number(bucket.routerPrimaryCumEnd) || 0,
        router_primary_split_gross: Number(bucket.routerPrimarySplitGross) || 0,
        trading_collateral_net_out: Number(bucket.tradingCollateralNetOut) || 0,
        lp_collateral_net_out: Number(bucket.lpCollateralNetOut) || 0,
        volume,
        volume_usd: volume * collateralPriceUsd,
        capital_deployed: Number(bucket.capitalDeployed) || 0,
        p2p_outcome_net_in: 0,
        traded: bucket.traded,
        window_start: startTimeByPeriod[period],
        window_end: endTime,
        // Phase 1 recomputes each window from scratch; the incremental roll sets this later.
        cashflow_through_ts: 0,
        updated_at: writtenAt,
      });
    }
  }

  return rows;
}

/** One materialized scope: `all` (no allowlist) or an app board over an expanded market set. */
export type LeaderboardScope = {
  appId: string;
  /** Expanded market ids (parents + children). `undefined` = every market on the chain. */
  marketIds: Set<string> | undefined;
};

/**
 * Aggregate per-market buckets into `pnl_leaderboard` rows, one scope at a time.
 *
 * This is what makes an app board a *view* over the same computation rather than its own pass:
 * `all` sums every bucket, an app sums the buckets inside its allowlist, and both come from the one
 * per-wallet compute. Adding an app stops costing a refresh job.
 *
 * `market_count` is `count(*) FILTER (WHERE traded)` — a count of distinct markets, not a sum. The
 * old per-job rows summed it across executors and chains at read time, which double-counted markets
 * two wallets shared.
 *
 * `roi` is deliberately left to `computeRoiUsd` on the caller: it is not additive, so it has to be
 * recomputed from the summed pnl and capital rather than aggregated from anywhere.
 */
export function aggregateBucketsForScope(args: {
  byMarketPeriod: Record<PortfolioPlPeriod, MarketPeriodBucket[]>;
  period: PortfolioPlPeriod;
  scope: LeaderboardScope;
}): {
  pnl: number;
  valueStart: number;
  valueEnd: number;
  /** Position value at the window start, without the router cash term. Not the ROI denominator —
   * that is `capitalDeployed` on its own (see `capitalUsdFromRow`). */
  valueStartMtm: number;
  tradingCollateralNetOut: number;
  lpCollateralNetOut: number;
  volume: number;
  capitalDeployed: number;
  marketCount: number;
} {
  const { byMarketPeriod, period, scope } = args;
  const totals = {
    pnl: 0,
    valueStart: 0,
    valueEnd: 0,
    valueStartMtm: 0,
    tradingCollateralNetOut: 0,
    lpCollateralNetOut: 0,
    volume: 0,
    capitalDeployed: 0,
    marketCount: 0,
  };

  for (const bucket of byMarketPeriod[period] ?? []) {
    if (scope.marketIds && !scope.marketIds.has(bucket.marketId.toLowerCase())) continue;
    totals.pnl += bucket.pnl;
    totals.valueStart += bucket.valueStartMtm + bucket.routerPrimaryCumStart;
    totals.valueStartMtm += bucket.valueStartMtm;
    totals.valueEnd += bucket.valueEndMtm + bucket.routerPrimaryCumEnd;
    totals.tradingCollateralNetOut += bucket.tradingCollateralNetOut;
    totals.lpCollateralNetOut += bucket.lpCollateralNetOut;
    totals.volume += bucket.volume;
    totals.capitalDeployed += bucket.capitalDeployed;
    if (bucket.traded) totals.marketCount += 1;
  }
  return totals;
}

/** `pnl_leaderboard` rows for every scope, folded from one wallet's per-market buckets. */
export function deriveLeaderboardRows(args: {
  address: string;
  chainId: number;
  byMarketPeriod: Record<PortfolioPlPeriod, MarketPeriodBucket[]>;
  scopes: LeaderboardScope[];
  collateralPriceUsd: number;
  writtenAt: string;
}): PnlLeaderboardInsert[] {
  const { address, chainId, byMarketPeriod, scopes, collateralPriceUsd, writtenAt } = args;
  const rows: PnlLeaderboardInsert[] = [];

  for (const scope of scopes) {
    for (const period of PORTFOLIO_PL_PERIODS) {
      const t = aggregateBucketsForScope({ byMarketPeriod, period, scope });
      const pnlUsd = t.pnl * collateralPriceUsd;
      rows.push({
        app_id: scope.appId,
        chain_id: chainId,
        address: address.toLowerCase(),
        period,
        pnl: t.pnl,
        pnl_usd: pnlUsd,
        collateral_price_usd: collateralPriceUsd,
        value_start: t.valueStart,
        value_end: t.valueEnd,
        trading_collateral_net_out: t.tradingCollateralNetOut,
        lp_collateral_net_out: t.lpCollateralNetOut,
        volume: t.volume,
        volume_usd: t.volume * collateralPriceUsd,
        capital_deployed: t.capitalDeployed,
        roi: computeRoiUsd({ pnlUsd, capitalDeployed: t.capitalDeployed, collateralPriceUsd }),
        market_count: t.marketCount,
        updated_at: writtenAt,
      });
    }
  }
  return rows;
}
