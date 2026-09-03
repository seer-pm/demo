import { describe, expect, it } from "vitest";
import { TRADER_SCORE_CONFIG as C, type TraderScoreInputs, computeTraderScore, tierForScore } from "./traderScore";

/**
 * An eligible, deliberately unremarkable wallet: 4 markets, half won, $1000 of scored capital.
 *
 * `pnlUsd` defaults to exactly what the scored markets account for. Every ratio in the score is
 * taken over the scored market set, and the coverage gate withholds the score when `pnlUsd`
 * disagrees with that set — so a fixture that set the two independently would silently test the
 * gate instead of whatever it meant to test.
 */
function inputs(over: Partial<TraderScoreInputs> = {}): TraderScoreInputs {
  const grossProfitUsd = over.grossProfitUsd ?? 100;
  const grossLossUsd = over.grossLossUsd ?? 100;
  return {
    scoredMarketCount: 4,
    winningMarketCount: 2,
    bestMarketPnlUsd: 50,
    scoredCapitalUsd: 1000,
    grossProfitUsd,
    grossLossUsd,
    pnlUsd: grossProfitUsd - grossLossUsd,
    ...over,
  };
}

describe("eligibility gate", () => {
  it("returns null below the market minimum", () => {
    expect(computeTraderScore(inputs({ scoredMarketCount: C.MIN_SCORED_MARKETS - 1 }))).toBeNull();
  });

  it("returns null below the capital minimum", () => {
    expect(computeTraderScore(inputs({ scoredCapitalUsd: C.MIN_CAPITAL_USD - 1 }))).toBeNull();
  });

  it("scores exactly at both thresholds", () => {
    const at = computeTraderScore(
      inputs({
        scoredMarketCount: C.MIN_SCORED_MARKETS,
        winningMarketCount: 2,
        scoredCapitalUsd: C.MIN_CAPITAL_USD,
      }),
    );
    expect(at).not.toBeNull();
  });

  it("is null, not zero, so the row sorts last rather than bottom", () => {
    // compareLeaderboardRows puts nulls last in BOTH directions; a 0 would rank above nothing.
    expect(computeTraderScore(inputs({ scoredMarketCount: 0 }))).toBeNull();
  });

  it("withholds the score when most of the wallet's P/L is outside the scored markets", () => {
    // The live regression: +$26,466 of P/L against three scored markets holding $43.59 of gross
    // profit and $99.80 of gross loss. It used to score 43.7 with `profitFactor` reading 0.66 —
    // "losing" — beside a +2014% ROI on the same row.
    expect(
      computeTraderScore({
        scoredMarketCount: 3,
        winningMarketCount: 1,
        grossProfitUsd: 43.59,
        grossLossUsd: 99.8,
        bestMarketPnlUsd: 43.59,
        scoredCapitalUsd: 1314,
        pnlUsd: 26_465.91,
      }),
    ).toBeNull();
  });

  it("withholds it for a book whose scored markets show no profit at all beside a large P/L", () => {
    // +$19,379 with gross profit of exactly $0 across the scored set. Used to read 25, "Weak".
    expect(
      computeTraderScore({
        scoredMarketCount: 3,
        winningMarketCount: 0,
        grossProfitUsd: 0,
        grossLossUsd: 2541.5,
        bestMarketPnlUsd: 0,
        scoredCapitalUsd: 4057,
        pnlUsd: 19_379,
      }),
    ).toBeNull();
  });

  it("tolerates the dust markets the scored set legitimately drops", () => {
    // Sub-$1 markets are excluded from the statistics but not from `pnlUsd`, so a small gap is
    // expected and must not cost the wallet its score.
    const r = computeTraderScore(inputs({ grossProfitUsd: 500, grossLossUsd: 100, pnlUsd: 404 }));
    expect(r).not.toBeNull();
  });
});

describe("components", () => {
  it("floors and ceilings each band instead of running off the scale", () => {
    const floor = computeTraderScore(
      inputs({ grossProfitUsd: 0, grossLossUsd: 10_000, bestMarketPnlUsd: 0, winningMarketCount: 0 }),
    )!;
    expect(floor.components.returns).toBe(0);
    expect(floor.components.profitFactor).toBe(0);
    expect(floor.components.hitRate).toBe(0);
    expect(floor.components.lossBurn).toBe(0);
    expect(floor.components.breadth).toBe(0);
    // Every component bottoms out, so the weighted mean is 0. The reported score is that pulled
    // back toward neutral by the confidence shrink — see the "sample shrink" block.
    expect(floor.sampleShrink.rawScore).toBe(0);

    const ceil = computeTraderScore(
      inputs({
        scoredMarketCount: 20,
        winningMarketCount: 20,
        grossProfitUsd: 10_000,
        grossLossUsd: 0,
        bestMarketPnlUsd: 500,
      }),
    )!;
    expect(ceil.components.returns).toBe(100);
    expect(ceil.components.profitFactor).toBe(100);
    expect(ceil.components.hitRate).toBe(100);
    expect(ceil.components.lossBurn).toBe(100);
    expect(ceil.components.breadth).toBe(100);
    expect(ceil.sampleShrink.rawScore).toBe(100);
  });

  it("never yields Infinity when nothing was lost", () => {
    const r = computeTraderScore(
      inputs({ grossProfitUsd: 200, grossLossUsd: 0, bestMarketPnlUsd: 70, scoredCapitalUsd: 10_000 }),
    )!;
    expect(Number.isFinite(r.inputs.profitFactor)).toBe(true);
    // The prior is 2% of the book's own gross flow, on both sides: (200 + 4) / (0 + 4).
    expect(r.inputs.profitFactor).toBeCloseTo(204 / 4, 10);
    // A flow-scaled prior no longer disguises a sample-size penalty, so three small wins do reach
    // the profit-factor ceiling. What keeps them off the top of the board is the shrink.
    expect(r.components.profitFactor).toBe(100);
    expect(r.score).toBeLessThan(65);
  });

  it("gives a loss-only book zero breadth, not full breadth", () => {
    // grossProfit = 0 would make `1 - best/grossProfit` NaN, or 1 if guarded naively.
    const r = computeTraderScore(
      inputs({ grossProfitUsd: 0, bestMarketPnlUsd: 0, grossLossUsd: 300, winningMarketCount: 0 }),
    )!;
    expect(r.components.breadth).toBe(0);
  });

  it("scores one concentrated winner far below the same profit spread over many", () => {
    const concentrated = computeTraderScore(
      inputs({ grossProfitUsd: 500, bestMarketPnlUsd: 500, grossLossUsd: 0, winningMarketCount: 1 }),
    )!;
    const spread = computeTraderScore(
      inputs({ grossProfitUsd: 500, bestMarketPnlUsd: 130, grossLossUsd: 0, winningMarketCount: 4 }),
    )!;
    expect(concentrated.components.breadth).toBe(0);
    expect(spread.components.breadth).toBeGreaterThan(90);
    expect(spread.score).toBeGreaterThan(concentrated.score);
  });

  it("keeps the hit-rate prior, so a perfect record on few markets is not read as certainty", () => {
    const r = computeTraderScore(
      inputs({
        scoredMarketCount: 3,
        winningMarketCount: 3,
        grossProfitUsd: 300,
        grossLossUsd: 0,
        bestMarketPnlUsd: 100,
      }),
    )!;
    // (3 + 2.5) / (3 + 5) = 0.6875, not 1.0.
    expect(r.inputs.hitRate).toBeCloseTo(0.6875, 10);
  });
});

describe("hit rate is scored against the wallet's own break-even", () => {
  /** 10 markets, 1 winner paying ~100x, 9 losers. Nine tenths of the trades lose; the book is +$900. */
  const longShot = computeTraderScore(
    inputs({
      scoredMarketCount: 10,
      winningMarketCount: 1,
      grossProfitUsd: 990,
      grossLossUsd: 90,
      bestMarketPnlUsd: 990,
    }),
  )!;

  /** 10 markets, 4 winners, wins and losses the same size, net negative. */
  const evenMoney = computeTraderScore(
    inputs({
      scoredMarketCount: 10,
      winningMarketCount: 4,
      grossProfitUsd: 100,
      grossLossUsd: 150,
      bestMarketPnlUsd: 25,
    }),
  )!;

  it("reads a break-even rate from the payoff ratio rather than assuming even money", () => {
    // Winners average $990, losers $10: this book only has to be right 1% of the time.
    expect(longShot.inputs.breakEvenHitRate).toBeCloseTo(10 / 1000, 10);
    // Wins and losses both average $25: this one has to be right half the time.
    expect(evenMoney.inputs.breakEvenHitRate).toBeCloseTo(0.5, 10);
  });

  it("credits a long-shot strategy that clears its own break-even", () => {
    // Under the fixed 35%-75% band this scored 0 for winning "only" 1 market in 10.
    expect(longShot.inputs.hitEdge).toBeGreaterThan(0);
    expect(longShot.components.hitRate).toBe(100);
    expect(longShot.components.hitRate).toBeGreaterThan(evenMoney.components.hitRate);
  });

  it("still penalises a book that does not clear it", () => {
    expect(evenMoney.inputs.hitEdge).toBeLessThan(0);
    expect(evenMoney.components.hitRate).toBeLessThan(50);
  });

  it("demands a coin flip from a book with no gross flow to infer odds from", () => {
    const flat = computeTraderScore(
      inputs({ grossProfitUsd: 0, grossLossUsd: 0, bestMarketPnlUsd: 0, winningMarketCount: 0 }),
    )!;
    expect(flat.inputs.breakEvenHitRate).toBe(0.5);
    expect(flat.components.hitRate).toBe(0);
  });
});

describe("sample shrink", () => {
  const thin = computeTraderScore(
    inputs({
      scoredMarketCount: 3,
      winningMarketCount: 3,
      grossProfitUsd: 300,
      grossLossUsd: 0,
      bestMarketPnlUsd: 100,
    }),
  )!;
  const deep = computeTraderScore(
    inputs({
      scoredMarketCount: 100,
      winningMarketCount: 100,
      grossProfitUsd: 10_000,
      grossLossUsd: 0,
      bestMarketPnlUsd: 300,
    }),
  )!;

  it("reports the factor and the pre-shrink mean, so the components can be reconciled", () => {
    expect(thin.sampleShrink.scoredMarketCount).toBe(3);
    expect(thin.sampleShrink.factor).toBeCloseTo(3 / (3 + C.SAMPLE_SHRINK_K), 10);
    expect(thin.score).toBeCloseTo(
      C.NEUTRAL_SCORE + (thin.sampleShrink.rawScore - C.NEUTRAL_SCORE) * thin.sampleShrink.factor,
      1,
    );
  });

  it("keeps a three-market book out of the top tier however good it looks", () => {
    // The live regression: an n=3 wallet with $2,516 of capital scored 91.1 and led the board over
    // an n=98 wallet with +$48,219 on $117,947.
    expect(thin.sampleShrink.rawScore).toBeGreaterThan(85);
    expect(thin.tier).not.toBe("Elite");
    const ceiling = C.NEUTRAL_SCORE + (100 - C.NEUTRAL_SCORE) * (3 / (3 + C.SAMPLE_SHRINK_K));
    expect(ceiling).toBeLessThan(70);
  });

  it("ranks the deep book above the thin one on the same quality of trading", () => {
    expect(deep.score).toBeGreaterThan(thin.score);
  });

  it("pulls a bad thin book up toward neutral too, not just a good one down", () => {
    const bad = computeTraderScore(
      inputs({
        scoredMarketCount: 3,
        winningMarketCount: 0,
        grossProfitUsd: 0,
        grossLossUsd: 900,
        bestMarketPnlUsd: 0,
      }),
    )!;
    expect(bad.sampleShrink.rawScore).toBe(0);
    expect(bad.score).toBeGreaterThan(0);
    expect(bad.score).toBeLessThan(C.NEUTRAL_SCORE);
  });
});

describe("live regressions", () => {
  it("scores a large, clean book on its real profit factor", () => {
    // +$43,055 over 23 markets: $53,903 of gross profit against $10,918 of gross loss on $523,072
    // of capital, 7 winners. The prior used to be 5% of peak capital — $26,154, more than twice the
    // actual losses — so a true factor of 4.94 reported 2.16, and a 30.4% hit rate fell 1.1pp under
    // a fixed 35% floor and scored 0. The wallet read 48.1, "Average".
    const r = computeTraderScore({
      scoredMarketCount: 23,
      winningMarketCount: 7,
      grossProfitUsd: 53_903,
      grossLossUsd: 10_918,
      bestMarketPnlUsd: 31_631,
      scoredCapitalUsd: 523_072,
      pnlUsd: 42_985,
    })!;
    expect(r.inputs.profitFactor).toBeGreaterThan(4);
    expect(r.components.profitFactor).toBe(100);
    expect(r.components.hitRate).toBe(100);
    expect(r.score).toBeGreaterThan(60);
    expect(r.tier).toBe("Good");
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

  it("is monotonic in scored profit: more profit never scores lower", () => {
    let previous = Number.NEGATIVE_INFINITY;
    for (const grossProfitUsd of [0, 100, 200, 500, 1000]) {
      const score = computeTraderScore(
        inputs({ grossProfitUsd, bestMarketPnlUsd: grossProfitUsd / 2, winningMarketCount: 2 }),
      )!.score;
      expect(score).toBeGreaterThanOrEqual(previous);
      previous = score;
    }
  });
});
