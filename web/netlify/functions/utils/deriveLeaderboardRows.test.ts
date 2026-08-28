import { describe, expect, it } from "vitest";
import type { MarketPeriodBucket } from "./marketPeriodBuckets";
import { aggregateBucketsForScope, deriveLeaderboardRows } from "./pnlMarketRows";
import { PORTFOLIO_PL_PERIODS, type PortfolioPlPeriod } from "./seerIndexerPortfolio";

const A = "0xaaaa000000000000000000000000000000000001";
const B = "0xbbbb000000000000000000000000000000000002";
const C = "0xcccc000000000000000000000000000000000003";

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

const BUCKETS = perPeriod([
  bucket(A, { pnl: 10, volume: 100, capitalDeployed: 50, valueEndMtm: 7, traded: true }),
  bucket(B, { pnl: -4, volume: 40, capitalDeployed: 20, routerPrimaryCumEnd: -6, traded: true }),
  bucket(C, { pnl: 1, volume: 5, capitalDeployed: 0, traded: false }),
]);

describe("aggregateBucketsForScope", () => {
  it("sums every bucket when the scope has no allowlist", () => {
    const t = aggregateBucketsForScope({
      byMarketPeriod: BUCKETS,
      period: "all",
      scope: { appId: "all", marketIds: undefined },
    });
    expect(t.pnl).toBeCloseTo(7, 10);
    expect(t.volume).toBeCloseTo(145, 10);
    expect(t.capitalDeployed).toBeCloseTo(70, 10);
    expect(t.valueEnd).toBeCloseTo(1, 10);
  });

  it("restricts to the allowlist", () => {
    const t = aggregateBucketsForScope({
      byMarketPeriod: BUCKETS,
      period: "all",
      scope: { appId: "app", marketIds: new Set([A]) },
    });
    expect(t.pnl).toBeCloseTo(10, 10);
    expect(t.volume).toBeCloseTo(100, 10);
  });

  it("counts traded markets rather than summing a per-row count", () => {
    const all = aggregateBucketsForScope({
      byMarketPeriod: BUCKETS,
      period: "all",
      scope: { appId: "all", marketIds: undefined },
    });
    // Three buckets, but C never traded.
    expect(all.marketCount).toBe(2);
  });

  it("matches the allowlist case-insensitively", () => {
    const t = aggregateBucketsForScope({
      byMarketPeriod: perPeriod([bucket(A.toUpperCase(), { pnl: 3 })]),
      period: "all",
      scope: { appId: "app", marketIds: new Set([A]) },
    });
    expect(t.pnl).toBeCloseTo(3, 10);
  });
});

describe("deriveLeaderboardRows", () => {
  const rows = deriveLeaderboardRows({
    address: "0xABCDEF0000000000000000000000000000000001",
    chainId: 100,
    byMarketPeriod: BUCKETS,
    scopes: [
      { appId: "all", marketIds: undefined },
      { appId: "foresight:movies-1", marketIds: new Set([A]) },
    ],
    collateralPriceUsd: 2,
    writtenAt: "2026-08-28T00:00:00.000Z",
  });

  it("emits one row per scope and period", () => {
    expect(rows).toHaveLength(2 * PORTFOLIO_PL_PERIODS.length);
    expect(new Set(rows.map((r) => r.app_id))).toEqual(new Set(["all", "foresight:movies-1"]));
  });

  it("gives the app board only its own markets, from the same buckets", () => {
    const app = rows.find((r) => r.app_id === "foresight:movies-1" && r.period === "all")!;
    const all = rows.find((r) => r.app_id === "all" && r.period === "all")!;
    expect(app.pnl).toBeCloseTo(10, 10);
    expect(all.pnl).toBeCloseTo(7, 10);
  });

  it("converts to USD at the refresh price", () => {
    const all = rows.find((r) => r.app_id === "all" && r.period === "all")!;
    expect(all.pnl_usd).toBeCloseTo(14, 10);
    expect(all.volume_usd).toBeCloseTo(290, 10);
  });

  it("recomputes ROI per scope instead of aggregating it", () => {
    const app = rows.find((r) => r.app_id === "foresight:movies-1" && r.period === "all")!;
    // capital_usd = (value_start 0 + capital_deployed 50) x 2 = 100; pnl_usd = 20.
    expect(app.roi).toBeCloseTo(0.2, 10);
  });

  it("keeps the router cash term out of the ROI denominator", () => {
    // A wallet that committed 30 via the router: value_start is negative, but the capital at risk
    // is not. Using value_start would shrink or invert the denominator.
    const committed = perPeriod([
      bucket(A, { pnl: 5, capitalDeployed: 30, routerPrimaryCumStart: -30, valueStartMtm: 0 }),
    ]);
    const [row] = deriveLeaderboardRows({
      address: "0x1",
      chainId: 100,
      byMarketPeriod: committed,
      scopes: [{ appId: "all", marketIds: undefined }],
      collateralPriceUsd: 1,
      writtenAt: "2026-08-28T00:00:00.000Z",
    });

    expect(row.value_start).toBeCloseTo(-30, 10);
    // pnl_usd 5 over capital 30, not over (−30 + 30) = 0.
    expect(row.roi).toBeCloseTo(5 / 30, 10);
  });

  it("lowercases the address so it joins with the per-market table", () => {
    expect(rows.every((r) => r.address === "0xabcdef0000000000000000000000000000000001")).toBe(true);
  });
});
