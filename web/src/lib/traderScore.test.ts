import { describe, expect, it } from "vitest";
import {
  TRADER_TIERS as SCORING_TIERS,
  TRADER_SCORE_CONFIG,
  tierForScore,
} from "../../netlify/functions/utils/traderScore";
import {
  MIN_CAPITAL_USD,
  MIN_SCORED_MARKETS,
  SCORE_FORMULA_HINT,
  TRADER_SCORE_COMPONENTS,
  TRADER_TIERS,
  TRADER_TIER_ABBR,
  TRADER_TIER_BANDS,
  TRADER_TIER_CLASS,
  scoreUnavailableReason,
} from "./traderScore";

/**
 * The presentation layer mirrors the scoring module's bands, weights and gate so the legend can show
 * them without a network round trip. These tests are the reason that duplication is safe: recalibrate
 * `TRADER_SCORE_CONFIG` and the UI copy fails here rather than silently lying to users.
 */
describe("trader score presentation mirrors the scoring module", () => {
  it("lists the same tiers, in the same order", () => {
    expect(TRADER_TIERS).toEqual(SCORING_TIERS.map((entry) => entry.tier));
    expect(TRADER_TIER_BANDS.map((band) => band.tier)).toEqual([...TRADER_TIERS]);
  });

  it("uses the real tier thresholds", () => {
    for (const band of TRADER_TIER_BANDS) {
      const scoring = SCORING_TIERS.find((entry) => entry.tier === band.tier);
      expect(scoring, `no scoring entry for ${band.tier}`).toBeDefined();
      // The bottom tier is unbounded below in the scoring module; the legend shows it as 0.
      const expectedMin = Number.isFinite(scoring!.min) ? scoring!.min : 0;
      expect(band.min, `${band.tier} lower bound`).toBe(expectedMin);
    }
  });

  it("shows bands that agree with tierForScore at their own edges", () => {
    for (const band of TRADER_TIER_BANDS) {
      expect(tierForScore(band.min)).toBe(band.tier);
      if (band.max != null) expect(tierForScore(band.max)).toBe(band.tier);
    }
  });

  it("uses the real component weights, and they still sum to 100", () => {
    const weights = Object.fromEntries(TRADER_SCORE_COMPONENTS.map((c) => [c.key, c.weight]));
    expect(weights).toEqual(TRADER_SCORE_CONFIG.WEIGHTS);
    expect(TRADER_SCORE_COMPONENTS.reduce((sum, c) => sum + c.weight, 0)).toBe(100);
  });

  it("uses the real eligibility gate", () => {
    expect(MIN_SCORED_MARKETS).toBe(TRADER_SCORE_CONFIG.MIN_SCORED_MARKETS);
    expect(MIN_CAPITAL_USD).toBe(TRADER_SCORE_CONFIG.MIN_CAPITAL_USD);
  });

  it("names lossBurn as the module names it, not as a worst-case loss", () => {
    // The scoring module's header is explicit that lossBurn is a terminal-state total, so copy
    // calling it a "worst loss" or a "drawdown" is wrong, not just loose.
    expect(SCORE_FORMULA_HINT).toContain("loss burn");
    expect(SCORE_FORMULA_HINT.toLowerCase()).not.toContain("worst loss");
    expect(SCORE_FORMULA_HINT.toLowerCase()).not.toContain("drawdown");
  });

  it("has a class and an abbreviation for every tier", () => {
    for (const tier of TRADER_TIERS) {
      expect(TRADER_TIER_CLASS[tier], `class for ${tier}`).toBeTruthy();
      expect(TRADER_TIER_ABBR[tier], `abbreviation for ${tier}`).toHaveLength(3);
    }
  });
});

describe("scoreUnavailableReason", () => {
  it("names both market counts, so the row does not contradict its own Traded Markets column", () => {
    const reason = scoreUnavailableReason(
      { reason: "markets", scoredMarketCount: 2, minScoredMarkets: 3, minCapitalUsd: 100 },
      182,
    );
    expect(reason).toContain("2 of 182");
    expect(reason).toContain("3");
  });

  it("reports the capital gate when that is what failed", () => {
    const reason = scoreUnavailableReason(
      { reason: "capital", scoredMarketCount: 8, minScoredMarkets: 3, minCapitalUsd: 100 },
      12,
    );
    expect(reason).toContain("$100");
    expect(reason).not.toContain("markets had over");
  });

  it("falls back to the general rule when the API sent no reason", () => {
    expect(scoreUnavailableReason(undefined, 5)).toContain("Not enough history");
  });

  it("keeps the singular readable for a one-market wallet", () => {
    const reason = scoreUnavailableReason(
      { reason: "markets", scoredMarketCount: 0, minScoredMarkets: 3, minCapitalUsd: 100 },
      1,
    );
    expect(reason).toContain("1 traded market had");
  });

  it("does not say '3 of 0' when a pure LP wallet has more scored markets than traded ones", () => {
    // `marketCount` needs a swap leg; the score's gate needs capital. An LP position has the second
    // without the first, so the two counts are not nested and the "X of Y" phrasing cannot be used.
    const reason = scoreUnavailableReason(
      { reason: "markets", scoredMarketCount: 3, minScoredMarkets: 5, minCapitalUsd: 100 },
      0,
    );
    expect(reason).not.toContain("of 0");
    expect(reason).toContain("3 markets had");
  });

  it("explains the coverage gate without blaming the wallet's history", () => {
    // This wallet has plenty of history — the score simply cannot read most of its P/L.
    const reason = scoreUnavailableReason(
      {
        reason: "coverage",
        scoredMarketCount: 3,
        minScoredMarkets: 3,
        minCapitalUsd: 100,
        unscoredPnlFraction: 0.97,
        maxUnscoredPnlFraction: 0.25,
      },
      182,
    );
    expect(reason).toContain("97%");
    expect(reason).toContain("conditional");
    expect(reason).toContain("P/L and ROI are still shown");
    expect(reason).not.toContain("scoring needs");
  });
});
