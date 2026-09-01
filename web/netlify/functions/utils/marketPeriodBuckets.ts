import type { PortfolioPosition, Token, TransactionData } from "@seer-pm/sdk";
import { formatUnits } from "viem";
import type { computeLpPrimaryCollateralNetOutForPeriodsFromEvents } from "./lpPrimaryCollateralFlow";
import type { computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents } from "./netPrimaryCollateralSwapFlow";
import { peakCapitalDeployedByMarket } from "./peakCapitalDeployed";
import { groupPortfolioValueAtReferenceByMarket, groupPortfolioValueCurrentByMarket } from "./portfolioValuation";
import {
  type ConditionalEventRow,
  PORTFOLIO_PL_PERIODS,
  type PortfolioPlPeriod,
  type RouterPrimaryMarketCumulative,
  dedupeConditionalEventLegs,
  routerPrimaryCumulativeByMarketAtTimes,
} from "./seerIndexerPortfolio";

/** One market's contribution to a wallet's P/L in one period window. */
export type MarketPeriodBucket = {
  marketId: string;
  /** Outcome-token mark-to-market at each end of the window. */
  valueStartMtm: number;
  valueEndMtm: number;
  /** Cumulative primary collateral from the router, at each end of the window. */
  routerPrimaryCumStart: number;
  routerPrimaryCumEnd: number;
  /** Gross split side inside the window. Kept for audit; NOT the ROI denominator — see `capitalDeployed`. */
  routerPrimarySplitGross: number;
  tradingCollateralNetOut: number;
  lpCollateralNetOut: number;
  volume: number;
  /**
   * Peak primary collateral at risk in this market during the window — see
   * `peakCapitalDeployedByMarket`. Deliberately not the gross sum of buys and splits, which is
   * unbounded for strategies that recycle capital.
   */
  capitalDeployed: number;
  /**
   * `swap buys + gross splits` — the older, unbounded reading, kept for audit only.
   *
   * Comparing it against `capitalDeployed` is the only way to see how much of a ROI change is
   * recycling versus capital genuinely committed, instead of assuming.
   */
  capitalDeployedGross: number;
  /** Had a market-collateral swap leg in the window; `market_count` counts these. */
  traded: boolean;
  /** `Δ(mtm + routerCum) − tradingCollateralNetOut − lpCollateralNetOut`. */
  pnl: number;
};

/**
 * Per-market P/L buckets, for every period, from data already fetched for the scalar path.
 *
 * One formula, additive by construction: the router term enters as a *cumulative* per market, so
 * `Δ(mtm + routerCum)` reproduces both the global path (which folds router collateral into `value*`)
 * and the scoped path (which adds the in-window net as a separate term) — they were the same
 * quantity written two ways.
 *
 * The market set is the **union** of every source, never just `positions`: a market where the wallet
 * held only a losing outcome on a closed market produces no position row (`buildPortfolioPositions`
 * drops it) yet can still carry swap and router flow.
 */
export function buildMarketPeriodBuckets(args: {
  positions: PortfolioPosition[];
  positionsAtStartByPeriod: Record<PortfolioPlPeriod, PortfolioPosition[]>;
  historyPrices: Record<PortfolioPlPeriod, Record<string, number | undefined>>;
  swapFlow: ReturnType<typeof computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents> | null;
  /** Raw swaps, needed to walk the capital balance over time rather than only its window total. */
  swaps: TransactionData[];
  lpFlow: ReturnType<typeof computeLpPrimaryCollateralNetOutForPeriodsFromEvents> | null;
  conditionalEvents: ConditionalEventRow[];
  primaryCollateral: Token;
  startTimeByPeriod: Record<PortfolioPlPeriod, number>;
  endTime: number;
}): Record<PortfolioPlPeriod, MarketPeriodBucket[]> {
  const {
    positions,
    positionsAtStartByPeriod,
    historyPrices,
    swapFlow,
    swaps,
    lpFlow,
    conditionalEvents,
    primaryCollateral,
    startTimeByPeriod,
    endTime,
  } = args;

  const decimals = primaryCollateral.decimals;
  const human = (weiValue: bigint) => Number(formatUnits(weiValue, decimals));

  const mtmEndByMarket = groupPortfolioValueCurrentByMarket(positions);

  // Sample the router cumulative at every window start and at the window end, from one sweep.
  const sampleTimes = [...PORTFOLIO_PL_PERIODS.map((p) => startTimeByPeriod[p]), endTime];
  const walletMarkets = new Set<string>([
    ...positions.map((p) => p.marketId.toLowerCase()),
    ...(swapFlow ? [...swapFlow.byStartTimeAndMarket.values()].flatMap((m) => [...m.keys()]) : []),
  ]);
  // Deduped once here: the peak walk and the cumulative sweep must see the same legs, or a fanned
  // out split would inflate capital in one and not the other.
  const { events: dedupedConditionalEvents } = dedupeConditionalEventLegs(conditionalEvents, walletMarkets);
  const { byTime: routerCumByTime } = routerPrimaryCumulativeByMarketAtTimes(
    conditionalEvents,
    primaryCollateral,
    sampleTimes,
    { preferMarketIds: walletMarkets },
  );
  const routerCumEnd = routerCumByTime.get(endTime) ?? new Map<string, RouterPrimaryMarketCumulative>();

  const out = {} as Record<PortfolioPlPeriod, MarketPeriodBucket[]>;

  for (const period of PORTFOLIO_PL_PERIODS) {
    const startTime = startTimeByPeriod[period];

    const mtmStartByMarket = groupPortfolioValueAtReferenceByMarket(
      positionsAtStartByPeriod[period],
      historyPrices[period],
      startTime,
    );
    const peakCapitalByMarket = peakCapitalDeployedByMarket({
      swaps,
      conditionalEvents: dedupedConditionalEvents,
      openingCapitalByMarket: mtmStartByMarket,
      primaryCollateral,
      startTime,
      endTime,
    });
    const swapByMarket = swapFlow?.byStartTimeAndMarket.get(startTime) ?? new Map();
    const lpByMarket = lpFlow?.netOutWeiByStartTimeAndMarket.get(startTime) ?? new Map();
    const routerCumStart = routerCumByTime.get(startTime) ?? new Map<string, RouterPrimaryMarketCumulative>();

    const marketIds = new Set<string>([
      ...mtmEndByMarket.keys(),
      ...mtmStartByMarket.keys(),
      ...swapByMarket.keys(),
      ...lpByMarket.keys(),
      ...routerCumStart.keys(),
      ...routerCumEnd.keys(),
    ]);

    const buckets: MarketPeriodBucket[] = [];
    for (const marketId of marketIds) {
      const swap = swapByMarket.get(marketId);
      const valueStartMtm = mtmStartByMarket.get(marketId) ?? 0;
      const valueEndMtm = mtmEndByMarket.get(marketId) ?? 0;
      const cumStart = routerCumStart.get(marketId);
      const cumEnd = routerCumEnd.get(marketId);
      const routerPrimaryCumStart = cumStart ? human(cumStart.netWei) : 0;
      const routerPrimaryCumEnd = cumEnd ? human(cumEnd.netWei) : 0;
      // Gross deployment inside the window, not since inception.
      const splitGrossWei = (cumEnd?.splitGrossWei ?? 0n) - (cumStart?.splitGrossWei ?? 0n);
      const routerPrimarySplitGross = human(splitGrossWei);

      const tradingCollateralNetOut = swap ? human(swap.netOutWei) : 0;
      const lpCollateralNetOut = human(lpByMarket.get(marketId) ?? 0n);
      const volume = swap ? human(swap.volumePrimaryWei) + swap.volumePriced : 0;
      const buys = swap ? human(swap.buysWei) : 0;

      const deltaValue = valueEndMtm + routerPrimaryCumEnd - (valueStartMtm + routerPrimaryCumStart);
      buckets.push({
        marketId,
        valueStartMtm,
        valueEndMtm,
        routerPrimaryCumStart,
        routerPrimaryCumEnd,
        routerPrimarySplitGross,
        tradingCollateralNetOut,
        lpCollateralNetOut,
        volume,
        capitalDeployed: peakCapitalByMarket.get(marketId) ?? 0,
        capitalDeployedGross: Math.max(buys, 0) + Math.max(routerPrimarySplitGross, 0),
        traded: swap?.traded ?? false,
        pnl: deltaValue - tradingCollateralNetOut - lpCollateralNetOut,
      });
    }
    out[period] = buckets;
  }

  return out;
}
