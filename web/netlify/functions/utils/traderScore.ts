/**
 * Trader score: a 0-100 summary of how a wallet traded, from the per-market P/L distribution.
 *
 * ## Why this is not stored
 *
 * The score is a weighted mean of clamped *ratios*, so it is not additive — exactly like `roi`,
 * which `pnl_market_leaderboard.sql` refuses to store for the same reason. The public board merges
 * rows along three axes before ranking: executor → owner (`rollUpRows`), split app scopes, and
 * chains (`chainId=all`). A per-(app, chain, wallet) score has no defensible combination rule:
 * +$100 on $100 of capital on one chain and −$100 on $100 on another score ~90 and ~5, while the
 * true combined wallet is ~40 (ROI 0, PF 1). Neither averaging nor capital-weighting recovers that.
 *
 * So `pnl_leaderboard` stores **sufficient statistics** — counts and sums over disjoint market sets,
 * plus one max — which merge with `+` and `Math.max` along all three axes, and the score is derived
 * once from the merged totals, at read time, beside the existing `roi`.
 *
 * ## What this measures, and what it does not
 *
 * The reference these bands are calibrated against scores a *daily* series: R² of the equity curve,
 * Sortino, % of positive days, max drawdown, profit factor over days. None of that is available
 * here — nothing in this repo persists a per-wallet time series (see the note on
 * `pnl_market_daily_delta`, which is declared but never written). The five components below are the
 * cross-*market* analogues:
 *
 *  - `profitFactor` is near-direct — the same ratio, over markets instead of days.
 *  - `hitRate` is a genuine proxy with a different unit. For a prediction market, "share of markets
 *    called right" is arguably the better event than "share of green days".
 *  - `lossBurn` is a **terminal-state** loss, not a drawdown. It is a strict lower bound: it cannot
 *    see a wallet that was 80% down mid-window and recovered.
 *  - `returns` is ROI, which has a capital denominator but no risk denominator. This is the weakest
 *    substitution for Sortino.
 *  - `breadth` is **not** consistency. R² asks whether the equity curve is a straight line through
 *    time; breadth asks whether profit came from one market or many. Related, not the same claim.
 *
 * Name them accordingly in any UI. `method` ships from day one so a later daily-series
 * implementation can coexist with this one and say which produced a given number.
 */

/** Every calibration constant, in one object, so recalibration is a single reviewable edit. */
export const TRADER_SCORE_CONFIG = {
  /** Weights sum to 100. */
  WEIGHTS: {
    returns: 25,
    profitFactor: 25,
    hitRate: 20,
    lossBurn: 15,
    breadth: 15,
  },

  /** Eligibility: below either of these the score is `null`, never a low number. */
  MIN_SCORED_MARKETS: 3,
  MIN_CAPITAL_USD: 100,

  /**
   * A market counts toward the scored set only above this much capital at risk, so a dusted or
   * airdropped position cannot pad the market count. Deliberately not `market_count`, which is
   * `count(*) FILTER (WHERE traded)`: an LP position with no swap leg is a real position.
   */
  MARKET_SCORE_DUST_USD: 1,

  ROI_FLOOR: -0.25,
  ROI_CEIL: 0.75,

  HIT_FLOOR: 0.35,
  HIT_CEIL: 0.75,
  /** Laplace prior on the hit rate: `PRIOR_N` pseudo-markets at `PRIOR_P`. Stops 1-for-1 reading 1.0. */
  HIT_PRIOR_P: 0.5,
  HIT_PRIOR_N: 5,

  PF_FLOOR: 0.5,
  PF_CEIL: 3.0,
  /**
   * Symmetric prior mass, as a fraction of capital, added to both sides of the profit factor.
   * Without it a wallet with no losing market divides by zero and reads `Infinity`; with it, $200
   * of profit and no loss on $10k of capital reads 1.4 — "three tiny wins", which is correct.
   */
  PF_PRIOR_FRACTION: 0.05,

  /** Gross loss as a fraction of capital. 0 → 100 points, this or worse → 0. */
  LOSS_BURN_CEIL: 0.5,

  /** `1 − bestMarket/grossProfit` at or above this scores 100 (≈ profit spread over 3+ markets). */
  BREADTH_CEIL: 0.7,
} as const;

export const TRADER_TIERS = [
  { tier: "Elite", min: 85 },
  { tier: "Great", min: 70 },
  { tier: "Good", min: 55 },
  { tier: "Average", min: 40 },
  { tier: "Weak", min: Number.NEGATIVE_INFINITY },
] as const;

export type TraderTier = (typeof TRADER_TIERS)[number]["tier"];

export function tierForScore(score: number): TraderTier {
  for (const entry of TRADER_TIERS) {
    if (score >= entry.min) return entry.tier;
  }
  return "Weak";
}

/**
 * Which eligibility gate a wallet missed, or `null` when it clears both.
 *
 * `computeTraderScore` returns a bare `null` because the score itself has no value to report. The
 * UI needs more than that: the leaderboard renders `marketCount` (every traded market) in a column
 * beside the score, while the gate counts `scoredMarketCount` (markets over `MARKET_SCORE_DUST_USD`).
 * A wallet with 182 traded markets and 2 scored ones reads as a contradiction unless the dash can
 * say which of the two numbers it is actually talking about.
 */
export type TraderScoreIneligibility = {
  reason: "markets" | "capital";
  scoredMarketCount: number;
  minScoredMarkets: number;
  minCapitalUsd: number;
};

export function traderScoreIneligibility(
  inputs: Pick<TraderScoreInputs, "scoredMarketCount" | "capitalUsd">,
): TraderScoreIneligibility | null {
  const C = TRADER_SCORE_CONFIG;
  const scoredMarketCount = Math.max(0, Math.trunc(Number(inputs.scoredMarketCount) || 0));
  const capitalUsd = Math.max(0, Number(inputs.capitalUsd) || 0);

  // Same order as computeTraderScore, so the reported reason is the gate that actually fired.
  const base = { scoredMarketCount, minScoredMarkets: C.MIN_SCORED_MARKETS, minCapitalUsd: C.MIN_CAPITAL_USD };
  if (scoredMarketCount < C.MIN_SCORED_MARKETS) return { reason: "markets", ...base };
  if (capitalUsd < C.MIN_CAPITAL_USD) return { reason: "capital", ...base };
  return null;
}

/**
 * Merged sufficient statistics for one participant. Every field is already summed across chains,
 * app scopes and executor wallets; all money is USD.
 */
export type TraderScoreInputs = {
  /** Markets with at least `MARKET_SCORE_DUST_USD` of capital at risk. */
  scoredMarketCount: number;
  /** Of those, the ones that ended the window in profit. */
  winningMarketCount: number;
  /** Σ max(pnl, 0) over scored markets. */
  grossProfitUsd: number;
  /** Σ max(−pnl, 0) over scored markets. Positive. */
  grossLossUsd: number;
  /** max(pnl) over scored markets, floored at 0. Merges with `Math.max`. */
  bestMarketPnlUsd: number;
  /** Net P/L; not `grossProfit − grossLoss`, which excludes dust markets. */
  pnlUsd: number;
  /** Peak primary collateral at risk — `capitalUsdFromRow`. The ROI denominator. */
  capitalUsd: number;
};

export type TraderScoreComponents = {
  returns: number;
  profitFactor: number;
  hitRate: number;
  lossBurn: number;
  breadth: number;
};

export type TraderScoreBreakdown = {
  /** Which implementation produced this. A daily-series variant would report `"daily"`. */
  method: "markets";
  score: number;
  tier: TraderTier;
  /** Each component's 0-100 contribution before weighting. */
  components: TraderScoreComponents;
  /** The raw ratios the components were derived from, for display and debugging. */
  inputs: {
    roi: number;
    profitFactor: number;
    hitRate: number;
    lossBurn: number;
    breadth: number;
  };
};

/** Clamped linear map onto 0-100. `lo` scores 0, `hi` scores 100. */
function lin(value: number, lo: number, hi: number): number {
  if (!Number.isFinite(value)) return value > 0 ? 100 : 0;
  const t = (value - lo) / (hi - lo);
  if (t <= 0) return 0;
  if (t >= 1) return 100;
  return t * 100;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * The score, or `null` when the wallet does not clear the eligibility gate.
 *
 * `null` is deliberate rather than 0: "too few markets to judge" is not "judged and bad", and
 * `compareLeaderboardRows` already sorts nulls last in both directions, which is the behaviour we
 * want for free.
 */
export function computeTraderScore(inputs: TraderScoreInputs): TraderScoreBreakdown | null {
  const C = TRADER_SCORE_CONFIG;

  const scoredMarketCount = Math.max(0, Math.trunc(Number(inputs.scoredMarketCount) || 0));
  const capitalUsd = Math.max(0, Number(inputs.capitalUsd) || 0);
  if (scoredMarketCount < C.MIN_SCORED_MARKETS) return null;
  if (capitalUsd < C.MIN_CAPITAL_USD) return null;

  const winningMarketCount = Math.max(0, Math.trunc(Number(inputs.winningMarketCount) || 0));
  const grossProfitUsd = Math.max(0, Number(inputs.grossProfitUsd) || 0);
  const grossLossUsd = Math.max(0, Number(inputs.grossLossUsd) || 0);
  const bestMarketPnlUsd = Math.max(0, Number(inputs.bestMarketPnlUsd) || 0);
  const pnlUsd = Number(inputs.pnlUsd) || 0;

  const roi = pnlUsd / capitalUsd;

  // Symmetric prior, in dollars, scaled to the size of the book.
  const prior = C.PF_PRIOR_FRACTION * capitalUsd;
  const profitFactor = (grossProfitUsd + prior) / (grossLossUsd + prior);

  const hitRate = (winningMarketCount + C.HIT_PRIOR_P * C.HIT_PRIOR_N) / (scoredMarketCount + C.HIT_PRIOR_N);

  const lossBurn = grossLossUsd / capitalUsd;

  // A book with no material profit has no distribution to be broad over; 0, not 1.
  const breadth = grossProfitUsd <= prior ? 0 : 1 - bestMarketPnlUsd / grossProfitUsd;

  const components: TraderScoreComponents = {
    returns: lin(roi, C.ROI_FLOOR, C.ROI_CEIL),
    profitFactor: lin(profitFactor, C.PF_FLOOR, C.PF_CEIL),
    hitRate: lin(hitRate, C.HIT_FLOOR, C.HIT_CEIL),
    lossBurn: lin(C.LOSS_BURN_CEIL - lossBurn, 0, C.LOSS_BURN_CEIL),
    breadth: lin(breadth, 0, C.BREADTH_CEIL),
  };

  const weighted =
    (components.returns * C.WEIGHTS.returns +
      components.profitFactor * C.WEIGHTS.profitFactor +
      components.hitRate * C.WEIGHTS.hitRate +
      components.lossBurn * C.WEIGHTS.lossBurn +
      components.breadth * C.WEIGHTS.breadth) /
    100;

  const score = round1(weighted);

  return {
    method: "markets",
    score,
    tier: tierForScore(score),
    components: {
      returns: round1(components.returns),
      profitFactor: round1(components.profitFactor),
      hitRate: round1(components.hitRate),
      lossBurn: round1(components.lossBurn),
      breadth: round1(components.breadth),
    },
    inputs: {
      roi,
      profitFactor,
      hitRate,
      lossBurn,
      breadth,
    },
  };
}
