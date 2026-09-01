import { describe, expect, it } from "vitest";
import { TRADER_SCORE_CONFIG as C, type TraderScoreInputs, computeTraderScore, tierForScore } from "./traderScore";

/** An eligible, deliberately unremarkable wallet: 4 markets, half won, $1000 of capital. */
function inputs(over: Partial<TraderScoreInputs> = {}): TraderScoreInputs {
  return {
    scoredMarketCount: 4,
    winningMarketCount: 2,
    grossProfitUsd: 100,
    grossLossUsd: 100,
    bestMarketPnlUsd: 50,
    pnlUsd: 0,
    capitalUsd: 1000,
    ...over,
  };
}

describe("eligibility gate", () => {
  it("returns null below the market minimum", () => {
    expect(computeTraderScore(inputs({ scoredMarketCount: C.MIN_SCORED_MARKETS - 1 }))).toBeNull();
  });

  it("returns null below the capital minimum", () => {
    expect(computeTraderScore(inputs({ capitalUsd: C.MIN_CAPITAL_USD - 1 }))).toBeNull();
  });

  it("scores exactly at both thresholds", () => {
    const at = computeTraderScore(
      inputs({ scoredMarketCount: C.MIN_SCORED_MARKETS, winningMarketCount: 2, capitalUsd: C.MIN_CAPITAL_USD }),
    );
    expect(at).not.toBeNull();
  });

  it("is null, not zero, so the row sorts last rather than bottom", () => {
    // compareLeaderboardRows puts nulls last in BOTH directions; a 0 would rank above nothing.
    expect(computeTraderScore(inputs({ scoredMarketCount: 0 }))).toBeNull();
  });
});

describe("components", () => {
  it("floors and ceilings each band instead of running off the scale", () => {
    const floor = computeTraderScore(
      inputs({ pnlUsd: -10_000, grossProfitUsd: 0, grossLossUsd: 10_000, bestMarketPnlUsd: 0, winningMarketCount: 0 }),
    )!;
    expect(floor.components.returns).toBe(0);
    expect(floor.components.profitFactor).toBe(0);
    expect(floor.components.hitRate).toBe(0);
    expect(floor.components.lossBurn).toBe(0);
    expect(floor.components.breadth).toBe(0);
    expect(floor.score).toBe(0);

    const ceil = computeTraderScore(
      inputs({
        scoredMarketCount: 20,
        winningMarketCount: 20,
        grossProfitUsd: 10_000,
        grossLossUsd: 0,
        bestMarketPnlUsd: 500,
        pnlUsd: 10_000,
      }),
    )!;
    expect(ceil.score).toBe(100);
    expect(ceil.tier).toBe("Elite");
  });

  it("never yields Infinity when nothing was lost", () => {
    // $200 of profit and no loss on $10k of capital is three small wins, not a perfect record.
    const r = computeTraderScore(
      inputs({ grossProfitUsd: 200, grossLossUsd: 0, bestMarketPnlUsd: 70, pnlUsd: 200, capitalUsd: 10_000 }),
    )!;
    expect(Number.isFinite(r.inputs.profitFactor)).toBe(true);
    expect(r.inputs.profitFactor).toBeCloseTo((200 + 500) / 500, 10);
    expect(r.components.profitFactor).toBeLessThan(50);
  });

  it("gives a loss-only book zero breadth, not full breadth", () => {
    // grossProfit = 0 would make `1 - best/grossProfit` NaN, or 1 if guarded naively.
    const r = computeTraderScore(
      inputs({ grossProfitUsd: 0, bestMarketPnlUsd: 0, grossLossUsd: 300, pnlUsd: -300, winningMarketCount: 0 }),
    )!;
    expect(r.components.breadth).toBe(0);
  });

  it("scores one concentrated winner far below the same profit spread over many", () => {
    const concentrated = computeTraderScore(
      inputs({ grossProfitUsd: 500, bestMarketPnlUsd: 500, grossLossUsd: 0, pnlUsd: 500, winningMarketCount: 1 }),
    )!;
    const spread = computeTraderScore(
      inputs({ grossProfitUsd: 500, bestMarketPnlUsd: 130, grossLossUsd: 0, pnlUsd: 500, winningMarketCount: 4 }),
    )!;
    expect(concentrated.components.breadth).toBe(0);
    expect(spread.components.breadth).toBeGreaterThan(90);
    expect(spread.score).toBeGreaterThan(concentrated.score);
  });

  it("damps a perfect record on few markets with the hit-rate prior", () => {
    const r = computeTraderScore(inputs({ scoredMarketCount: 3, winningMarketCount: 3 }))!;
    // (3 + 2.5) / (3 + 5) = 0.6875, not 1.0.
    expect(r.inputs.hitRate).toBeCloseTo(0.6875, 10);
    expect(r.components.hitRate).toBeLessThan(100);
  });
});

describe("tiers", () => {
  it("cuts at the reference thresholds", () => {
    expect(tierForScore(85)).toBe("Elite");
    expect(tierForScore(84.9)).toBe("Great");
    expect(tierForScore(70)).toBe("Great");
    expect(tierForScore(69.9)).toBe("Good");
    expect(tierForScore(55)).toBe("Good");
    expect(tierForScore(54.9)).toBe("Average");
    expect(tierForScore(40)).toBe("Average");
    expect(tierForScore(39.9)).toBe("Weak");
    expect(tierForScore(0)).toBe("Weak");
  });
});

describe("shape", () => {
  it("weights sum to 100, so the score cannot exceed its scale", () => {
    const total = Object.values(C.WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });

  it("reports the method so a later daily-series score can coexist", () => {
    expect(computeTraderScore(inputs())!.method).toBe("markets");
  });

  it("is monotonic in P/L: more profit never scores lower", () => {
    let previous = Number.NEGATIVE_INFINITY;
    for (const pnlUsd of [-500, -200, 0, 200, 500, 1000]) {
      const score = computeTraderScore(inputs({ pnlUsd }))!.score;
      expect(score).toBeGreaterThanOrEqual(previous);
      previous = score;
    }
  });
});
