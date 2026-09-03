import { describe, expect, it } from "vitest";
import { type MarketPeriodBucket, mergeMarketPeriodBuckets } from "./marketPeriodBuckets";
import { PORTFOLIO_PL_PERIODS, type PortfolioPlPeriod } from "./seerIndexerPortfolio";

const A = "0xaaaa000000000000000000000000000000000001";
const B = "0xbbbb000000000000000000000000000000000002";

function bucket(marketId: string, over: Partial<MarketPeriodBucket> = {}): MarketPeriodBucket {
  return {
    marketId,
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

const perPeriod = <T>(v: T) =>
  Object.fromEntries(PORTFOLIO_PL_PERIODS.map((p) => [p, v])) as Record<PortfolioPlPeriod, T>;

describe("mergeMarketPeriodBuckets", () => {
  it("adds the capital of one member to the value of another on the same market", () => {
    // The sweep pattern: the executor bought and holds nothing at the end, the owner holds the
    // tokens it was swept. Apart, one side is dust and the other has no capital.
    const executor = perPeriod([
      bucket(A, { capitalDeployed: 50, tradingCollateralNetOut: 50, valueEndMtm: 0.1, pnl: -49.9, traded: true }),
    ]);
    const owner = perPeriod([bucket(A, { valueEndMtm: 90, pnl: 90 })]);

    const [merged] = mergeMarketPeriodBuckets([executor, owner]).all;
    expect(merged.capitalDeployed).toBeCloseTo(50, 10);
    expect(merged.pnl).toBeCloseTo(40.1, 10);
    expect(merged.valueEndMtm).toBeCloseTo(90.1, 10);
    expect(merged.traded).toBe(true);
  });

  it("keeps markets only one member touched", () => {
    const one = perPeriod([bucket(A, { pnl: 3 })]);
    const other = perPeriod([bucket(B, { pnl: -1 })]);
    const merged = mergeMarketPeriodBuckets([one, other]).all;
    expect(merged.map((b) => b.marketId).sort()).toEqual([A, B]);
    expect(merged.find((b) => b.marketId === A)!.pnl).toBeCloseTo(3, 10);
  });

  it("groups case-insensitively and emits lowercase ids, so rows join with the per-market table", () => {
    const upper = perPeriod([bucket(A.toUpperCase(), { pnl: 2, capitalDeployed: 5 })]);
    const lower = perPeriod([bucket(A, { pnl: 4 })]);
    const merged = mergeMarketPeriodBuckets([upper, lower]).all;
    expect(merged).toHaveLength(1);
    expect(merged[0].marketId).toBe(A);
    expect(merged[0].pnl).toBeCloseTo(6, 10);
  });

  it("merges each period independently", () => {
    const executor = { ...perPeriod([] as MarketPeriodBucket[]), all: [bucket(A, { pnl: 7 })] };
    const owner = { ...perPeriod([] as MarketPeriodBucket[]), "1d": [bucket(A, { pnl: 2 })] };
    const merged = mergeMarketPeriodBuckets([executor, owner]);
    expect(merged.all[0].pnl).toBeCloseTo(7, 10);
    expect(merged["1d"][0].pnl).toBeCloseTo(2, 10);
    expect(merged["1w"]).toEqual([]);
  });

  it("returns a single member unchanged, so a wallet without executors is unaffected", () => {
    const only = perPeriod([bucket(A, { pnl: 5, capitalDeployed: 9, traded: true }), bucket(B, { pnl: -2 })]);
    expect(mergeMarketPeriodBuckets([only])).toEqual(only);
  });

  it("sums every extensive field", () => {
    const one = perPeriod([
      bucket(A, {
        valueStartMtm: 1,
        valueEndMtm: 2,
        routerPrimaryCumStart: 3,
        routerPrimaryCumEnd: 4,
        routerPrimarySplitGross: 5,
        tradingCollateralNetOut: 6,
        lpCollateralNetOut: 7,
        volume: 8,
        capitalDeployed: 9,
        capitalDeployedGross: 10,
        pnl: 11,
      }),
    ]);
    const [merged] = mergeMarketPeriodBuckets([one, one]).all;
    expect(merged).toEqual(
      bucket(A, {
        valueStartMtm: 2,
        valueEndMtm: 4,
        routerPrimaryCumStart: 6,
        routerPrimaryCumEnd: 8,
        routerPrimarySplitGross: 10,
        tradingCollateralNetOut: 12,
        lpCollateralNetOut: 14,
        volume: 16,
        capitalDeployed: 18,
        capitalDeployedGross: 20,
        pnl: 22,
      }),
    );
  });

  it("does not mutate its inputs", () => {
    const one = perPeriod([bucket(A, { pnl: 1, capitalDeployed: 2 })]);
    const two = perPeriod([bucket(A, { pnl: 4 })]);
    mergeMarketPeriodBuckets([one, two]);
    expect(one.all[0].pnl).toBeCloseTo(1, 10);
    expect(two.all[0].pnl).toBeCloseTo(4, 10);
  });
});
