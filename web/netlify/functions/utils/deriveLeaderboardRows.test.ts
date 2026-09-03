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
      collateralPriceUsd: 1,
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
      collateralPriceUsd: 1,
    });
    expect(t.pnl).toBeCloseTo(10, 10);
    expect(t.volume).toBeCloseTo(100, 10);
  });

  it("counts traded markets rather than summing a per-row count", () => {
    const all = aggregateBucketsForScope({
      byMarketPeriod: BUCKETS,
      period: "all",
      scope: { appId: "all", marketIds: undefined },
      collateralPriceUsd: 1,
    });
    // Three buckets, but C never traded.
    expect(all.marketCount).toBe(2);
  });

  it("accumulates the trader score statistics over non-dust markets", () => {
    const t = aggregateBucketsForScope({
      byMarketPeriod: BUCKETS,
      period: "all",
      scope: { appId: "all", marketIds: undefined },
      collateralPriceUsd: 1,
    });
    // C carries no capital, so it is dust and stays out of the distribution even though it profited.
    expect(t.scoredMarketCount).toBe(2);
    expect(t.winningMarketCount).toBe(1);
    expect(t.grossProfit).toBeCloseTo(10, 10);
    expect(t.grossLoss).toBeCloseTo(4, 10);
    expect(t.bestMarketPnl).toBeCloseTo(10, 10);
    expect(t.scoredCapital).toBeCloseTo(70, 10);
  });

  it("keeps scored capital narrower than capital deployed, so every ratio shares one market set", () => {
    // B carries capital, but only $0.50 of it: it is dust, so its $4 of profit and its capital both
    // stay out of the score while remaining in `pnl` and `capitalDeployed`. That gap is what the
    // score's coverage gate measures — see `traderScore.ts`.
    const buckets = perPeriod([
      bucket(A, { pnl: 10, capitalDeployed: 50, traded: true }),
      bucket(B, { pnl: 4, capitalDeployed: 0.5, traded: true }),
    ]);
    const t = aggregateBucketsForScope({
      byMarketPeriod: buckets,
      period: "all",
      scope: { appId: "all", marketIds: undefined },
      collateralPriceUsd: 1,
    });
    expect(t.capitalDeployed).toBeCloseTo(50.5, 10);
    expect(t.scoredCapital).toBeCloseTo(50, 10);
    expect(t.pnl).toBeCloseTo(14, 10);
    expect(t.grossProfit).toBeCloseTo(10, 10);
  });

  it("excludes a market whose capital is below the dust threshold in USD, not in native units", () => {
    // 5 native units of capital is $5 at price 1 (scored) but $0.50 at price 0.1 (dust).
    const buckets = perPeriod([bucket(A, { pnl: 2, capitalDeployed: 5, traded: true })]);
    const scope = { appId: "all", marketIds: undefined };
    expect(
      aggregateBucketsForScope({ byMarketPeriod: buckets, period: "all", scope, collateralPriceUsd: 1 })
        .scoredMarketCount,
    ).toBe(1);
    expect(
      aggregateBucketsForScope({ byMarketPeriod: buckets, period: "all", scope, collateralPriceUsd: 0.1 })
        .scoredMarketCount,
    ).toBe(0);
  });

  it("matches the allowlist case-insensitively", () => {
    const t = aggregateBucketsForScope({
      byMarketPeriod: perPeriod([bucket(A.toUpperCase(), { pnl: 3 })]),
      period: "all",
      scope: { appId: "app", marketIds: new Set([A]) },
      collateralPriceUsd: 1,
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
    // capital_usd = capital_deployed 50 x 2 = 100 (no value_start term); pnl_usd = 20.
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

  it("converts the score statistics to USD, like pnl_usd and volume_usd", () => {
    const all = rows.find((r) => r.app_id === "all" && r.period === "all")!;
    expect(all.scored_market_count).toBe(2);
    expect(all.winning_market_count).toBe(1);
    // Native 10 / 4 / 10 at the refresh price of 2.
    expect(all.gross_profit_usd).toBeCloseTo(20, 10);
    expect(all.gross_loss_usd).toBeCloseTo(8, 10);
    expect(all.best_market_pnl_usd).toBeCloseTo(20, 10);
    // Native 70 at the same price.
    expect(all.scored_capital_usd).toBeCloseTo(140, 10);
  });

  it("scopes the score statistics to the app allowlist, like every other total", () => {
    const app = rows.find((r) => r.app_id === "foresight:movies-1" && r.period === "all")!;
    expect(app.scored_market_count).toBe(1);
    expect(app.winning_market_count).toBe(1);
    expect(app.gross_loss_usd).toBeCloseTo(0, 10);
    expect(app.scored_capital_usd).toBeCloseTo(100, 10);
  });

  it("lowercases the address so it joins with the per-market table", () => {
    expect(rows.every((r) => r.address === "0xabcdef0000000000000000000000000000000001")).toBe(true);
  });
});
