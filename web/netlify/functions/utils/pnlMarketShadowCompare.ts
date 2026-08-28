import type { MarketPeriodBucket } from "./marketPeriodBuckets";
import type { PortfolioPlPeriodSnapshot } from "./portfolioPlCompute";
import { PORTFOLIO_PL_PERIODS, type PortfolioPlPeriod } from "./seerIndexerPortfolio";

/** Absolute tolerance, in primary collateral units. Below this, a diff is float noise. */
export const SHADOW_ABS_TOLERANCE = 0.01;
/** Relative tolerance against the scalar, for wallets whose numbers are large. */
export const SHADOW_REL_TOLERANCE = 0.001;

export type FieldDiff = {
  field: string;
  fold: number;
  scalar: number;
  diff: number;
};

export type PeriodComparison = {
  period: PortfolioPlPeriod;
  marketCount: number;
  fields: FieldDiff[];
  pnlDiff: number;
  /**
   * How much of `pnlDiff` is the router term changing source: the global scalar folds
   * `Transfer{kind:router_collateral}` into `value*` as a running balance, while the buckets derive
   * the same quantity from `ConditionalEvent`. The two disagree wherever a split/merge/redeem did
   * not go through the router, which the transfer-based side never sees.
   */
  routerTermDiff: number;
  /** `pnlDiff − routerTermDiff`. Anything here is NOT explained by the known structural change. */
  residual: number;
  /**
   * The scalar sees router collateral that the per-market fold does not.
   *
   * `routerTermDiff` is signed and absorbs both directions, so a zero residual does **not** mean
   * both sides agree — only that the difference sits in the router term. This flag names the
   * direction that matters: the fold is *missing* committed capital, so it understates cost and
   * overstates P/L. Verified in production on optimism wallets that have `router_collateral`
   * transfers and no `ConditionalEvent` at all, leaving the per-market side nothing to attribute.
   */
  routerOnlyInScalar: boolean;
  withinTolerance: boolean;
};

export function isWithinTolerance(diff: number, scalar: number): boolean {
  const abs = Math.abs(diff);
  return abs < SHADOW_ABS_TOLERANCE || abs <= SHADOW_REL_TOLERANCE * Math.abs(scalar);
}

function sum<T>(items: T[], pick: (item: T) => number): number {
  return items.reduce((acc, item) => acc + pick(item), 0);
}

function diff(field: string, fold: number, scalar: number): FieldDiff {
  return { field, fold, scalar, diff: fold - scalar };
}

/**
 * Compare `Σ per-market` against the scalar snapshot the current code produces, for one period.
 *
 * This writes nothing. Its job is to answer one question before any schema change: is every
 * difference accounted for by a known, intended change, or is something unexplained?
 *
 * Two differences are expected and are not bugs:
 * - **router term source** (`routerTermDiff`), described on that field;
 * - **capital deployed**: the global scalar counts swap buys only, while a per-market row adds the
 *   gross primary split through the router. Reported as a field diff, deliberately not subtracted —
 *   it changes every ROI, which is a visible ranking change worth seeing in full.
 *
 * `residual` is the number that matters. Non-zero means the market fold lost or duplicated
 * something: a market missing from the union, a fanned-out leg counted twice, an unmapped swap.
 */
export function comparePeriod(
  period: PortfolioPlPeriod,
  buckets: MarketPeriodBucket[],
  snapshot: PortfolioPlPeriodSnapshot,
): PeriodComparison {
  const foldPnl = sum(buckets, (b) => b.pnl);
  const foldMtmDelta = sum(buckets, (b) => b.valueEndMtm - b.valueStartMtm);
  const foldRouterDelta = sum(buckets, (b) => b.routerPrimaryCumEnd - b.routerPrimaryCumStart);

  const scalarValueDelta = snapshot.valueEnd - snapshot.valueStart;
  // Both halves come from the snapshot itself. Deriving either by subtracting the fold would make
  // the comparison self-confirming: a market missing from the fold would land in the collateral
  // term and be reported as "explained by the router source".
  const scalarCollateralDelta = (snapshot.collateralValueEnd ?? 0) - (snapshot.collateralValueStart ?? 0);
  const scalarMtmDelta = scalarValueDelta - scalarCollateralDelta;
  // The scoped scalar keeps its router term outside `value*`; add it back to compare like for like.
  const scalarRouterDelta = scalarCollateralDelta + (snapshot.routerPrimaryCollateralNetInWindow ?? 0);

  const pnlDiff = foldPnl - snapshot.pnl;
  const routerTermDiff = foldRouterDelta - scalarRouterDelta;

  const fields = [
    diff("pnl", foldPnl, snapshot.pnl),
    diff("valueDelta", foldMtmDelta + foldRouterDelta, scalarValueDelta),
    diff("mtmDelta", foldMtmDelta, scalarMtmDelta),
    diff("routerDelta", foldRouterDelta, scalarRouterDelta),
    diff(
      "tradingCollateralNetOut",
      sum(buckets, (b) => b.tradingCollateralNetOut),
      snapshot.tradingCollateralNetOut,
    ),
    diff(
      "lpCollateralNetOut",
      sum(buckets, (b) => b.lpCollateralNetOut),
      snapshot.lpCollateralNetOut,
    ),
    diff(
      "volume",
      sum(buckets, (b) => b.volume),
      snapshot.volume,
    ),
    diff(
      "capitalDeployed",
      sum(buckets, (b) => b.capitalDeployed),
      snapshot.capitalDeployed,
    ),
    // Not a comparison against the scalar: both sides are the fold, peak vs gross. It quantifies
    // how much the ROI denominator owes to recycling rather than to committed capital.
    diff(
      "capitalPeakVsGross",
      sum(buckets, (b) => b.capitalDeployed),
      sum(buckets, (b) => b.capitalDeployedGross),
    ),
    diff("marketCount", buckets.filter((b) => b.traded).length, snapshot.marketCount),
  ];

  const residual = pnlDiff - routerTermDiff;
  const routerOnlyInScalar =
    Math.abs(foldRouterDelta) < SHADOW_ABS_TOLERANCE && Math.abs(scalarRouterDelta) >= SHADOW_ABS_TOLERANCE;

  return {
    period,
    marketCount: buckets.length,
    fields,
    pnlDiff,
    routerTermDiff,
    residual,
    routerOnlyInScalar,
    withinTolerance: isWithinTolerance(residual, snapshot.pnl),
  };
}

export type WalletComparison = {
  account: string;
  chainId: number;
  periods: PeriodComparison[];
  /** True when every period's residual is inside tolerance — i.e. nothing unexplained. */
  clean: boolean;
  /** Largest absolute residual across periods, for ranking the worst offenders. */
  worstResidual: number;
};

export function compareWallet(
  account: string,
  chainId: number,
  byMarketPeriod: Record<PortfolioPlPeriod, MarketPeriodBucket[]>,
  byPeriod: Record<PortfolioPlPeriod, PortfolioPlPeriodSnapshot>,
): WalletComparison {
  const periods = PORTFOLIO_PL_PERIODS.map((period) =>
    comparePeriod(period, byMarketPeriod[period] ?? [], byPeriod[period]),
  );
  return {
    account: account.toLowerCase(),
    chainId,
    periods,
    clean: periods.every((p) => p.withinTolerance),
    worstResidual: Math.max(...periods.map((p) => Math.abs(p.residual))),
  };
}

export type ShadowSummary = {
  wallets: number;
  clean: number;
  unexplained: number;
  /**
   * Wallets with a non-trivial number on either side.
   *
   * Without this, a sample of dormant wallets reports every diff as zero and reads exactly like a
   * perfect run. A comparison that cannot distinguish "nothing differs" from "nothing was compared"
   * is not evidence.
   */
  walletsWithSignal: number;
  /**
   * Wallets where the scalar sees router collateral the fold does not — the fold is missing
   * committed capital. Counted separately because `residual` treats it as explained.
   */
  walletsRouterOnlyInScalar: number;
  /** Which wallets those are — a count alone cannot be chased. */
  routerOnlyInScalarWallets: Array<{ account: string; chainId: number; periods: PortfolioPlPeriod[] }>;
  /** Field-level totals across the sample, so a systematic shift is visible even when it nets out. */
  totalAbsDiffByField: Record<string, number>;
  /** Magnitude of what was compared, per field — the denominator for reading `totalAbsDiffByField`. */
  totalAbsScalarByField: Record<string, number>;
  worstWallets: Array<{ account: string; chainId: number; period: PortfolioPlPeriod; residual: number }>;
};

/** A wallet counts as carrying signal when any period has a scalar worth comparing against. */
export function hasSignal(wallet: WalletComparison): boolean {
  return wallet.periods.some((period) => period.fields.some((field) => Math.abs(field.scalar) > SHADOW_ABS_TOLERANCE));
}

export function summarize(comparisons: WalletComparison[], worstN = 10): ShadowSummary {
  const totalAbsDiffByField: Record<string, number> = {};
  const totalAbsScalarByField: Record<string, number> = {};
  const worst: ShadowSummary["worstWallets"] = [];

  for (const wallet of comparisons) {
    for (const period of wallet.periods) {
      for (const field of period.fields) {
        totalAbsDiffByField[field.field] = (totalAbsDiffByField[field.field] ?? 0) + Math.abs(field.diff);
        totalAbsScalarByField[field.field] = (totalAbsScalarByField[field.field] ?? 0) + Math.abs(field.scalar);
      }
      if (!period.withinTolerance) {
        worst.push({
          account: wallet.account,
          chainId: wallet.chainId,
          period: period.period,
          residual: period.residual,
        });
      }
    }
  }

  worst.sort((a, b) => Math.abs(b.residual) - Math.abs(a.residual));

  return {
    wallets: comparisons.length,
    clean: comparisons.filter((c) => c.clean).length,
    unexplained: comparisons.filter((c) => !c.clean).length,
    walletsWithSignal: comparisons.filter(hasSignal).length,
    walletsRouterOnlyInScalar: comparisons.filter((c) => c.periods.some((p) => p.routerOnlyInScalar)).length,
    routerOnlyInScalarWallets: comparisons
      .filter((c) => c.periods.some((p) => p.routerOnlyInScalar))
      .map((c) => ({
        account: c.account,
        chainId: c.chainId,
        periods: c.periods.filter((p) => p.routerOnlyInScalar).map((p) => p.period),
      })),
    totalAbsDiffByField,
    totalAbsScalarByField,
    worstWallets: worst.slice(0, worstN),
  };
}
