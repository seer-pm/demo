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
 * ## Where the statistics are gathered
 *
 * Merging them is not enough on the executor axis, because the dust gate below runs *before* the
 * merge would. A TradeExecutor buys and periodically sweeps the outcome tokens to its owner EOA, so
 * per address one side holds the capital and the other the value, and every market is dust on both:
 * the wallet in the report that motivated this read $43.59 of gross profit against +$26,466 of P/L,
 * and the coverage gate below withheld its score. Summing two already-gated sets cannot undo that.
 *
 * The statistics are therefore gathered over the owner's addresses *together*
 * (`mergeMarketPeriodBuckets`, `deriveOwnerGroupRows`) and stored on the owner's row, with the
 * executors' rows carrying zeros. The `+`/`Math.max` merge still runs on the read path, for the app
 * and chain axes, and remains a no-op on the executor one.
 *
 * ## One market set, or none
 *
 * Every ratio below divides two numbers gathered over the *same* markets: those carrying more than
 * `MARKET_SCORE_DUST_USD` of capital. That is why `scoredCapitalUsd` exists as its own statistic
 * rather than reusing the row's `capital_deployed`.
 *
 * The first version did reuse it, and the mix was visible on the public board: one wallet showed
 * +$26,466 and +2014% ROI beside a score built from three markets holding $43.59 of gross profit
 * and $99.80 of gross loss — `returns` came from the whole book and read 100, `profitFactor` came
 * from the scored subset and read 0.66, and the row asserted both at once. The cause is upstream:
 * `peakCapitalDeployedByMarket` only counts primary-collateral moves, so a conditional market (whose
 * pool is `childOutcome ↔ parentOutcome`) books full MTM P/L against zero capital and never clears
 * the dust gate, while its P/L still lands in `pnl_usd`.
 *
 * Sharing a denominator fixes the arithmetic but not the omission, so `MAX_UNSCORED_PNL_FRACTION`
 * gates it directly: when the scored markets do not account for the wallet's P/L, the score is
 * `null` with `reason: "coverage"`. A dash is the honest answer there — the alternative is a
 * confident number about markets we cannot see.
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
 *  - `hitRate` is scored against the wallet's own break-even rate, not a fixed band. A prediction
 *    market pays out inversely to the price paid, so "won 30% of markets" is excellent at 4:1
 *    average odds and ruinous at 1:2. The fixed 35% floor this replaced assumed even money and
 *    zeroed every long-shot strategy by construction, including profitable ones: a real wallet with
 *    a 4.94 profit factor scored 0 on it. The cost is that the edge over break-even is monotone in
 *    the profit factor (`PF = (h/(1−h))·(avgWin/avgLoss)`), so the two components are not
 *    independent; the weights account for that by favouring `profitFactor`.
 *  - `lossBurn` is a **terminal-state** loss, not a drawdown, and not a bound on one either: it
 *    cannot see a wallet that was 80% down mid-window and recovered, and losses realized in
 *    different markets at different times need not line up into any single portfolio drawdown.
 *  - `returns` is ROI, which has a capital denominator but no risk denominator. This is the weakest
 *    substitution for Sortino.
 *  - `breadth` is **not** consistency. R² asks whether the equity curve is a straight line through
 *    time; breadth asks whether profit came from one market or many. Related, not the same claim.
 *
 * Name them accordingly in any UI. `method` ships from day one so a later daily-series
 * implementation can coexist with this one and say which produced a given number.
 *
 * ## Small books are shrunk, not gated
 *
 * `MIN_SCORED_MARKETS` is a floor on having any opinion at all; it is not a confidence adjustment,
 * and on its own it let three-market wallets top the board over wallets with a hundred markets and
 * twenty times the profit. `SAMPLE_SHRINK_K` pulls the weighted mean toward `NEUTRAL_SCORE` by
 * `n / (n + K)`, symmetrically: too little evidence reads *undecided*, in both directions, rather
 * than excellent. A three-market book can no longer reach the top tier, which is the point.
 */

/** Every calibration constant, in one object, so recalibration is a single reviewable edit. */
export const TRADER_SCORE_CONFIG = {
  /** Weights sum to 100. */
  WEIGHTS: {
    returns: 25,
    profitFactor: 30,
    hitRate: 15,
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

  /**
   * How much of the wallet's P/L may sit outside the scored markets before the score is withheld,
   * as a fraction of the larger of |pnl| and the scored capital. At 0.25 the worst offenders on the
   * live board (ratios 1.00, 1.13, 0.97) go to `null` while a healthy wallet reads 0.002.
   */
  MAX_UNSCORED_PNL_FRACTION: 0.25,

  ROI_FLOOR: -0.25,
  ROI_CEIL: 0.75,

  /**
   * Hit rate is scored as its distance from the wallet's own break-even rate, in points of
   * probability: 10pp below break-even scores 0, 15pp above scores 100.
   */
  HIT_EDGE_FLOOR: -0.1,
  HIT_EDGE_CEIL: 0.15,
  /** Laplace prior on the hit rate: `PRIOR_N` pseudo-markets at `PRIOR_P`. Stops 1-for-1 reading 1.0. */
  HIT_PRIOR_P: 0.5,
  HIT_PRIOR_N: 5,

  PF_FLOOR: 0.5,
  PF_CEIL: 3.0,
  /**
   * Symmetric prior mass added to both sides of the profit factor, as a fraction of the book's own
   * gross flow (profit + loss). Without any prior a wallet with no losing market divides by zero.
   *
   * It used to be a fraction of *peak capital*, which made it a sample-size penalty in disguise and
   * a badly aimed one: on a large, clean book the prior dwarfed the real losses, so a live wallet
   * with $53.9k of profit against $10.9k of losses — a true factor of 4.94 — carried a $26.2k prior
   * and reported 2.16, costing it ~8 points of score. Another reported 1.87 against a true 380.
   * Scaling to the book's own flow makes the prior self-normalizing; `SAMPLE_SHRINK_K` now does the
   * sample-size job it was quietly doing.
   */
  PF_PRIOR_FRACTION: 0.02,
  /** Floor for that prior, so a book with no gross flow at all reads 1.0 rather than `NaN`. */
  PF_PRIOR_MIN_USD: 1,

  /** Gross loss as a fraction of scored capital. 0 → 100 points, this or worse → 0. */
  LOSS_BURN_CEIL: 0.5,

  /** `1 − bestMarket/grossProfit` at or above this scores 100 (≈ profit spread over 3+ markets). */
  BREADTH_CEIL: 0.7,

  /**
   * Confidence shrink toward `NEUTRAL_SCORE`, in markets. The weighted mean keeps `n / (n + K)` of
   * its distance from neutral, so n=3 keeps 23% and n=98 keeps 91%.
   */
  SAMPLE_SHRINK_K: 10,
  NEUTRAL_SCORE: 50,
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
 * Which eligibility gate a wallet missed, or `null` when it clears all three.
 *
 * `computeTraderScore` returns a bare `null` because the score itself has no value to report. The
 * UI needs more than that: the leaderboard renders `marketCount` (every traded market) in a column
 * beside the score, while the gate counts `scoredMarketCount` (markets over `MARKET_SCORE_DUST_USD`).
 * A wallet with 182 traded markets and 2 scored ones reads as a contradiction unless the dash can
 * say which of the two numbers it is actually talking about.
 */
export type TraderScoreIneligibility = {
  reason: "markets" | "capital" | "coverage";
  scoredMarketCount: number;
  minScoredMarkets: number;
  minCapitalUsd: number;
  dustUsd: number;
  /** Share of the wallet's P/L the scored markets do not account for. Only meaningful for `coverage`. */
  unscoredPnlFraction: number;
  maxUnscoredPnlFraction: number;
};

/** The gate inputs, in the order `computeTraderScore` applies them. */
type GateInputs = Pick<
  TraderScoreInputs,
  "scoredMarketCount" | "scoredCapitalUsd" | "grossProfitUsd" | "grossLossUsd" | "pnlUsd"
>;

/**
 * How much of `pnlUsd` the scored markets fail to explain, relative to the size of the book.
 *
 * Over the scored set `Σ pnl` is `grossProfit − grossLoss` by construction, so any gap is P/L the
 * score cannot see — a conditional market, an airdropped position, anything that moved value
 * without moving primary collateral.
 */
function unscoredPnlFraction(inputs: GateInputs): number {
  const scoredPnlUsd = (Number(inputs.grossProfitUsd) || 0) - (Number(inputs.grossLossUsd) || 0);
  const pnlUsd = Number(inputs.pnlUsd) || 0;
  const scoredCapitalUsd = Math.max(0, Number(inputs.scoredCapitalUsd) || 0);
  const base = Math.max(Math.abs(pnlUsd), scoredCapitalUsd);
  if (base <= 0) return 0;
  return Math.abs(pnlUsd - scoredPnlUsd) / base;
}

export function traderScoreIneligibility(inputs: GateInputs): TraderScoreIneligibility | null {
  const C = TRADER_SCORE_CONFIG;
  const scoredMarketCount = Math.max(0, Math.trunc(Number(inputs.scoredMarketCount) || 0));
  const scoredCapitalUsd = Math.max(0, Number(inputs.scoredCapitalUsd) || 0);
  const fraction = unscoredPnlFraction(inputs);

  // Same order as computeTraderScore, so the reported reason is the gate that actually fired.
  const base = {
    scoredMarketCount,
    minScoredMarkets: C.MIN_SCORED_MARKETS,
    minCapitalUsd: C.MIN_CAPITAL_USD,
    dustUsd: C.MARKET_SCORE_DUST_USD,
    unscoredPnlFraction: fraction,
    maxUnscoredPnlFraction: C.MAX_UNSCORED_PNL_FRACTION,
  };
  if (scoredMarketCount < C.MIN_SCORED_MARKETS) return { reason: "markets", ...base };
  if (scoredCapitalUsd < C.MIN_CAPITAL_USD) return { reason: "capital", ...base };
  if (fraction > C.MAX_UNSCORED_PNL_FRACTION) return { reason: "coverage", ...base };
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
  /** Peak primary collateral at risk over the scored markets. Every ratio's denominator. */
  scoredCapitalUsd: number;
  /**
   * Net P/L over *every* market, dust included — the number the leaderboard displays. It is not a
   * denominator anywhere; it is here only so the coverage gate can compare it against
   * `grossProfitUsd − grossLossUsd` and refuse to score a book it cannot account for.
   */
  pnlUsd: number;
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
  /**
   * The confidence shrink applied after weighting. Without this the components cannot be reconciled
   * with the score — their weighted points sum to `rawScore`, not to `score`.
   */
  sampleShrink: {
    scoredMarketCount: number;
    /** `n / (n + SAMPLE_SHRINK_K)`. */
    factor: number;
    /** The weighted mean before shrinking. */
    rawScore: number;
  };
  /** The raw ratios the components were derived from, for display and debugging. */
  inputs: {
    roi: number;
    profitFactor: number;
    /** Prior-adjusted share of scored markets that ended in profit. */
    hitRate: number;
    /** The hit rate this wallet's own payoff ratio needs to break even. */
    breakEvenHitRate: number;
    /** `hitRate − breakEvenHitRate`. What the component actually scores. */
    hitEdge: number;
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
  const scoredCapitalUsd = Math.max(0, Number(inputs.scoredCapitalUsd) || 0);
  if (scoredMarketCount < C.MIN_SCORED_MARKETS) return null;
  if (scoredCapitalUsd < C.MIN_CAPITAL_USD) return null;
  if (unscoredPnlFraction(inputs) > C.MAX_UNSCORED_PNL_FRACTION) return null;

  const winningMarketCount = Math.max(0, Math.trunc(Number(inputs.winningMarketCount) || 0));
  const grossProfitUsd = Math.max(0, Number(inputs.grossProfitUsd) || 0);
  const grossLossUsd = Math.max(0, Number(inputs.grossLossUsd) || 0);
  const bestMarketPnlUsd = Math.max(0, Number(inputs.bestMarketPnlUsd) || 0);

  // Over the scored markets this *is* the net P/L; `pnlUsd` spans dust markets too, and the
  // coverage gate above has already established the two are close.
  const roi = (grossProfitUsd - grossLossUsd) / scoredCapitalUsd;

  // Symmetric prior, in dollars, scaled to the book's own gross flow.
  const prior = Math.max(C.PF_PRIOR_FRACTION * (grossProfitUsd + grossLossUsd), C.PF_PRIOR_MIN_USD);
  const profitFactor = (grossProfitUsd + prior) / (grossLossUsd + prior);

  const hitRate = (winningMarketCount + C.HIT_PRIOR_P * C.HIT_PRIOR_N) / (scoredMarketCount + C.HIT_PRIOR_N);

  // The hit rate this book's own payoff ratio needs to break even. A wallet whose winners pay 4x
  // its losers only has to be right 20% of the time; one trading even money has to be right half.
  const losingMarketCount = Math.max(0, scoredMarketCount - winningMarketCount);
  const avgWinUsd = winningMarketCount > 0 ? grossProfitUsd / winningMarketCount : 0;
  const avgLossUsd = losingMarketCount > 0 ? grossLossUsd / losingMarketCount : 0;
  const breakEvenHitRate =
    avgWinUsd + avgLossUsd > 0
      ? avgLossUsd / (avgWinUsd + avgLossUsd)
      : // No gross flow at all: no payoff ratio to infer, so demand a coin flip rather than handing
        // a book that never moved a full component.
        0.5;
  const hitEdge = hitRate - breakEvenHitRate;

  const lossBurn = grossLossUsd / scoredCapitalUsd;

  // A book with no material profit has no distribution to be broad over; 0, not 1.
  const breadth = grossProfitUsd <= C.PF_PRIOR_MIN_USD ? 0 : 1 - bestMarketPnlUsd / grossProfitUsd;

  const components: TraderScoreComponents = {
    returns: lin(roi, C.ROI_FLOOR, C.ROI_CEIL),
    profitFactor: lin(profitFactor, C.PF_FLOOR, C.PF_CEIL),
    hitRate: lin(hitEdge, C.HIT_EDGE_FLOOR, C.HIT_EDGE_CEIL),
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

  // Symmetric confidence shrink: a thin book reads undecided, not excellent and not terrible.
  const factor = scoredMarketCount / (scoredMarketCount + C.SAMPLE_SHRINK_K);
  const score = round1(C.NEUTRAL_SCORE + (weighted - C.NEUTRAL_SCORE) * factor);

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
    sampleShrink: {
      scoredMarketCount,
      factor,
      rawScore: round1(weighted),
    },
    inputs: {
      roi,
      profitFactor,
      hitRate,
      breakEvenHitRate,
      hitEdge,
      lossBurn,
      breadth,
    },
  };
}
