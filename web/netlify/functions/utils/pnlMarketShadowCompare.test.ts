import { describe, expect, it } from "vitest";
import type { MarketPeriodBucket } from "./marketPeriodBuckets";
import { comparePeriod, compareWallet, isWithinTolerance, summarize } from "./pnlMarketShadowCompare";
import type { PortfolioPlPeriodSnapshot } from "./portfolioPlCompute";
import { PORTFOLIO_PL_PERIODS, type PortfolioPlPeriod } from "./seerIndexerPortfolio";

function bucket(over: Partial<MarketPeriodBucket> = {}): MarketPeriodBucket {
  return {
    marketId: "0xa",
    valueStartMtm: 0,
    valueEndMtm: 0,
    routerPrimaryCumStart: 0,
    routerPrimaryCumEnd: 0,
    routerPrimarySplitGross: 0,
    tradingCollateralNetOut: 0,
    lpCollateralNetOut: 0,
    volume: 0,
    capitalDeployed: 0,
    capitalDeployedGross: 0,
    traded: false,
    pnl: 0,
    ...over,
  };
}

function snapshot(over: Partial<PortfolioPlPeriodSnapshot> = {}): PortfolioPlPeriodSnapshot {
  return {
    account: "0xacc",
    chainId: 100,
    period: "1d",
    startTime: 1_000,
    endTime: 2_000,
    valueStart: 0,
    valueEnd: 0,
    tradingCollateralNetOut: 0,
    lpCollateralNetOut: 0,
    volume: 0,
    marketCount: 0,
    capitalDeployed: 0,
    pnl: 0,
    ...over,
  };
}

const field = (c: ReturnType<typeof comparePeriod>, name: string) => c.fields.find((f) => f.field === name)!;

describe("comparePeriod", () => {
  it("reports no residual when the fold matches the scalar", () => {
    const buckets = [
      bucket({ marketId: "0xa", valueEndMtm: 10, tradingCollateralNetOut: 4, pnl: 6, traded: true }),
      bucket({ marketId: "0xb", valueEndMtm: 5, tradingCollateralNetOut: 5, pnl: 0, traded: true }),
    ];
    const scalar = snapshot({
      valueEnd: 15,
      tradingCollateralNetOut: 9,
      pnl: 6,
      marketCount: 2,
    });

    const result = comparePeriod("1d", buckets, scalar);

    expect(result.pnlDiff).toBeCloseTo(0, 10);
    expect(result.residual).toBeCloseTo(0, 10);
    expect(result.withinTolerance).toBe(true);
    expect(field(result, "marketCount").diff).toBe(0);
  });

  it("attributes a router-source difference to routerTermDiff, leaving no residual", () => {
    // Buckets see a 12 split via ConditionalEvent; the global scalar never saw it because the
    // split did not pass through the router, so its collateral term stayed flat.
    const buckets = [bucket({ routerPrimaryCumEnd: -12, valueEndMtm: 12, pnl: 0 })];
    const scalar = snapshot({ valueEnd: 12, collateralValueEnd: 0, pnl: 12 });

    const result = comparePeriod("1d", buckets, scalar);

    expect(result.pnlDiff).toBeCloseTo(-12, 10);
    expect(result.routerTermDiff).toBeCloseTo(-12, 10);
    expect(result.residual).toBeCloseTo(0, 10);
    expect(result.withinTolerance).toBe(true);
  });

  it("leaves a residual when the fold actually lost a market", () => {
    // A market with flow exists in the scalar but produced no bucket.
    const buckets = [bucket({ marketId: "0xa", valueEndMtm: 10, pnl: 10 })];
    const scalar = snapshot({ valueEnd: 25, pnl: 25 });

    const result = comparePeriod("1d", buckets, scalar);

    expect(result.residual).toBeCloseTo(-15, 10);
    expect(result.withinTolerance).toBe(false);
  });

  it("compares like for like on the scoped path, where the router term sits outside value*", () => {
    const buckets = [bucket({ valueEndMtm: 20, routerPrimaryCumEnd: -12, pnl: 8 })];
    const scalar = snapshot({
      valueEnd: 20,
      routerPrimaryCollateralNetInWindow: -12,
      pnl: 8,
    });

    const result = comparePeriod("1d", buckets, scalar);

    expect(result.routerTermDiff).toBeCloseTo(0, 10);
    expect(result.residual).toBeCloseTo(0, 10);
  });

  it("surfaces the capital-deployed change without folding it into the residual", () => {
    const buckets = [
      bucket({ capitalDeployed: 9 + 12, capitalDeployedGross: 21, routerPrimarySplitGross: 12, pnl: 0 }),
    ];
    const scalar = snapshot({ capitalDeployed: 9, pnl: 0 });

    const result = comparePeriod("1d", buckets, scalar);

    expect(field(result, "capitalDeployed").diff).toBeCloseTo(12, 10);
    expect(result.residual).toBeCloseTo(0, 10);
  });

  it("flags when only the scalar sees router collateral, even though the residual is zero", () => {
    // Scalar booked a 750 cost via router_collateral transfers; the fold has no ConditionalEvent to
    // attribute, so it overstates P/L by 750 while `residual` still reads as explained.
    const buckets = [bucket({ valueEndMtm: 0, pnl: 750 })];
    const scalar = snapshot({ valueEnd: -750, collateralValueEnd: -750, pnl: 0 });

    const result = comparePeriod("all", buckets, scalar);

    expect(result.residual).toBeCloseTo(0, 10);
    expect(result.routerOnlyInScalar).toBe(true);
  });

  it("does not flag when both sides see the router term", () => {
    const buckets = [bucket({ routerPrimaryCumEnd: -750, pnl: -750 })];
    const scalar = snapshot({ valueEnd: -750, collateralValueEnd: -750, pnl: -750 });

    expect(comparePeriod("all", buckets, scalar).routerOnlyInScalar).toBe(false);
  });
});

describe("isWithinTolerance", () => {
  it("accepts float noise in absolute terms", () => {
    expect(isWithinTolerance(0.005, 0)).toBe(true);
    expect(isWithinTolerance(0.05, 0)).toBe(false);
  });

  it("accepts a proportionally small diff on a large number", () => {
    expect(isWithinTolerance(5, 100_000)).toBe(true);
    expect(isWithinTolerance(5_000, 100_000)).toBe(false);
  });
});

describe("compareWallet / summarize", () => {
  const allPeriods = <T>(v: T) =>
    Object.fromEntries(PORTFOLIO_PL_PERIODS.map((p) => [p, v])) as Record<PortfolioPlPeriod, T>;

  it("flags a wallet as unexplained when any period has a residual", () => {
    const buckets = allPeriods([bucket({ valueEndMtm: 1, pnl: 1 })]);
    const scalars = allPeriods(snapshot({ valueEnd: 1, pnl: 1 }));
    const dirty = { ...scalars, "1w": snapshot({ period: "1w", valueEnd: 50, pnl: 50 }) };

    expect(compareWallet("0xACC", 100, buckets, scalars).clean).toBe(true);
    const result = compareWallet("0xACC", 100, buckets, dirty);
    expect(result.clean).toBe(false);
    expect(result.account).toBe("0xacc");
    expect(result.worstResidual).toBeCloseTo(49, 10);
  });

  it("does not count a dormant wallet as signal, so a vacuous run is visible", () => {
    const dormant = compareWallet("0x0", 100, allPeriods([bucket()]), allPeriods(snapshot()));
    const active = compareWallet(
      "0x1",
      100,
      allPeriods([bucket({ valueEndMtm: 5, pnl: 5 })]),
      allPeriods(snapshot({ valueEnd: 5, pnl: 5 })),
    );

    const summary = summarize([dormant, active]);

    expect(summary.clean).toBe(2);
    expect(summary.walletsWithSignal).toBe(1);
    expect(summary.totalAbsScalarByField.pnl).toBeCloseTo(5 * PORTFOLIO_PL_PERIODS.length, 8);
  });

  it("ranks the worst offenders and totals field drift across the sample", () => {
    const clean = compareWallet(
      "0x1",
      100,
      allPeriods([bucket({ valueEndMtm: 1, pnl: 1 })]),
      allPeriods(snapshot({ valueEnd: 1, pnl: 1 })),
    );
    const broken = compareWallet(
      "0x2",
      100,
      allPeriods([bucket({ valueEndMtm: 1, pnl: 1 })]),
      allPeriods(snapshot({ valueEnd: 100, pnl: 100 })),
    );

    const summary = summarize([clean, broken]);

    expect(summary.wallets).toBe(2);
    expect(summary.clean).toBe(1);
    expect(summary.unexplained).toBe(1);
    expect(summary.worstWallets[0].account).toBe("0x2");
    expect(summary.totalAbsDiffByField.pnl).toBeCloseTo(99 * PORTFOLIO_PL_PERIODS.length, 8);
  });
});
