import type { Address } from "viem";
import { type MarketPeriodBucket, mergeMarketPeriodBuckets } from "./marketPeriodBuckets";
import { computeRoiUsd } from "./pnlLeaderboardMetrics";
import { PORTFOLIO_PL_PERIODS, type PortfolioPlPeriod } from "./seerIndexerPortfolio";
import type { TablesInsert } from "./supabase";
import { TRADER_SCORE_CONFIG } from "./traderScore";

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
 *
 * The trailing six totals are the trader score's sufficient statistics. They are accumulated here
 * because this loop already visits every bucket, and because the per-market distribution they
 * summarise is gone by the time the read path sees a `pnl_leaderboard` row. Like `roi`, the score
 * itself is never stored — see `traderScore.ts` for why.
 *
 * They describe an *owner's* book, not an address's: `deriveOwnerGroupRows` runs this over the
 * buckets of the owner and its TradeExecutors merged together, and writes the result on the owner's
 * row alone. An executor's own row carries zeros, because the read path sums the statistics of every
 * member and counting the same market twice is worse than counting it once.
 */
export function aggregateBucketsForScope(args: {
  byMarketPeriod: Record<PortfolioPlPeriod, MarketPeriodBucket[]>;
  period: PortfolioPlPeriod;
  scope: LeaderboardScope;
  /** Needed only for the score's dust gate, which is denominated in USD. */
  collateralPriceUsd: number;
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
  /** Markets carrying more than dust capital. Not `marketCount`: an LP position never swaps. */
  scoredMarketCount: number;
  winningMarketCount: number;
  grossProfit: number;
  /** Positive. */
  grossLoss: number;
  bestMarketPnl: number;
  /**
   * `capitalDeployed` restricted to the scored markets — the score's own denominator.
   *
   * Not the same number as `capitalDeployed`, and deliberately so: that one spans every market,
   * including the conditional ones that carry MTM P/L against zero primary collateral, so dividing
   * a gross profit gathered here by a capital gathered there mixes two market sets. See
   * `traderScore.ts`.
   */
  scoredCapital: number;
} {
  const { byMarketPeriod, period, scope, collateralPriceUsd } = args;
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
    scoredMarketCount: 0,
    winningMarketCount: 0,
    grossProfit: 0,
    grossLoss: 0,
    bestMarketPnl: 0,
    scoredCapital: 0,
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

    // Dust markets are excluded from the distribution so they cannot pad breadth or the hit rate.
    if (bucket.capitalDeployed * collateralPriceUsd < TRADER_SCORE_CONFIG.MARKET_SCORE_DUST_USD) continue;
    totals.scoredMarketCount += 1;
    totals.scoredCapital += bucket.capitalDeployed;
    if (bucket.pnl > 0) {
      totals.winningMarketCount += 1;
      totals.grossProfit += bucket.pnl;
      if (bucket.pnl > totals.bestMarketPnl) totals.bestMarketPnl = bucket.pnl;
    } else if (bucket.pnl < 0) {
      totals.grossLoss += -bucket.pnl;
    }
  }
  return totals;
}

const ZERO_SCORE_STATS = {
  scoredMarketCount: 0,
  winningMarketCount: 0,
  grossProfit: 0,
  grossLoss: 0,
  bestMarketPnl: 0,
  scoredCapital: 0,
};

/**
 * `pnl_leaderboard` rows for every scope, folded from one wallet's per-market buckets.
 *
 * Totals always come from the wallet's own buckets: they are additive, so the read path can sum an
 * executor's row into its owner's. The score statistics are not — they are a statement about a
 * per-market distribution *after* a dust gate — so `statsByMarketPeriod` decides where they come
 * from: omitted, this wallet's own buckets (a wallet with no executors); a record, the owner group's
 * merged buckets; `null`, no statistics at all, six zeros. See `deriveOwnerGroupRows`.
 */
export function deriveLeaderboardRows(args: {
  address: string;
  chainId: number;
  byMarketPeriod: Record<PortfolioPlPeriod, MarketPeriodBucket[]>;
  statsByMarketPeriod?: Record<PortfolioPlPeriod, MarketPeriodBucket[]> | null;
  scopes: LeaderboardScope[];
  collateralPriceUsd: number;
  writtenAt: string;
}): PnlLeaderboardInsert[] {
  const { address, chainId, byMarketPeriod, statsByMarketPeriod, scopes, collateralPriceUsd, writtenAt } = args;
  const rows: PnlLeaderboardInsert[] = [];

  for (const scope of scopes) {
    for (const period of PORTFOLIO_PL_PERIODS) {
      const t = aggregateBucketsForScope({
        byMarketPeriod,
        period,
        scope,
        collateralPriceUsd,
      });
      const stats =
        statsByMarketPeriod === undefined
          ? t
          : statsByMarketPeriod === null
            ? ZERO_SCORE_STATS
            : aggregateBucketsForScope({
                byMarketPeriod: statsByMarketPeriod,
                period,
                scope,
                collateralPriceUsd,
              });
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
        roi: computeRoiUsd({
          pnlUsd,
          capitalDeployed: t.capitalDeployed,
          collateralPriceUsd,
        }),
        market_count: t.marketCount,
        // Trader score statistics. Stored in USD, like pnl_usd / volume_usd, because they are only
        // ever consumed together with each other; the score itself is derived at read time.
        scored_market_count: stats.scoredMarketCount,
        winning_market_count: stats.winningMarketCount,
        gross_profit_usd: stats.grossProfit * collateralPriceUsd,
        gross_loss_usd: stats.grossLoss * collateralPriceUsd,
        best_market_pnl_usd: stats.bestMarketPnl * collateralPriceUsd,
        scored_capital_usd: stats.scoredCapital * collateralPriceUsd,
        updated_at: writtenAt,
      });
    }
  }
  return rows;
}

/**
 * `pnl_leaderboard` rows for one owner and its TradeExecutor contracts, scored as a single book.
 *
 * The executor buys and sweeps the outcome tokens to the owner EOA, so per address one side holds
 * the capital and the other the value. Gathering the statistics per `(wallet, market)` puts both
 * sides under the dust gate and leaves the owner's P/L unaccounted for, which the score's coverage
 * gate then reports as an unreadable book. `mergeMarketPeriodBuckets` combines the group's buckets
 * before the gate; the statistics land on the canonical row and every other member writes zeros, so
 * the read path's `mergeScoreStats` sum still yields exactly the group's statistics.
 *
 * Totals stay per member — they are additive and the read path sums them, so moving them would
 * double-count. A single-member group is exactly `deriveLeaderboardRows`.
 */
export function deriveOwnerGroupRows(args: {
  /** The owner EOA. Always written, even when it did not trade itself. */
  canonical: string;
  members: { address: string; byMarketPeriod: Record<PortfolioPlPeriod, MarketPeriodBucket[]> }[];
  chainId: number;
  scopes: LeaderboardScope[];
  collateralPriceUsd: number;
  writtenAt: string;
}): PnlLeaderboardInsert[] {
  const { canonical, members, chainId, scopes, collateralPriceUsd, writtenAt } = args;
  const canonicalAddress = canonical.toLowerCase();
  const merged = mergeMarketPeriodBuckets(members.map((member) => member.byMarketPeriod));
  const emptyBuckets = () => {
    const empty = {} as Record<PortfolioPlPeriod, MarketPeriodBucket[]>;
    for (const period of PORTFOLIO_PL_PERIODS) empty[period] = [];
    return empty;
  };

  const rows: PnlLeaderboardInsert[] = [];
  let wroteCanonical = false;
  for (const member of members) {
    const isCanonical = member.address.toLowerCase() === canonicalAddress;
    wroteCanonical ||= isCanonical;
    rows.push(
      ...deriveLeaderboardRows({
        address: member.address,
        chainId,
        byMarketPeriod: member.byMarketPeriod,
        statsByMarketPeriod: isCanonical ? merged : null,
        scopes,
        collateralPriceUsd,
        writtenAt,
      }),
    );
  }

  // The caller always computes the owner, but a group whose statistics landed nowhere would be a
  // silent loss: no row carries them and the read path sums zeros.
  if (!wroteCanonical) {
    rows.push(
      ...deriveLeaderboardRows({
        address: canonicalAddress,
        chainId,
        byMarketPeriod: emptyBuckets(),
        statsByMarketPeriod: merged,
        scopes,
        collateralPriceUsd,
        writtenAt,
      }),
    );
  }

  return rows;
}
