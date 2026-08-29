import { describe, expect, it } from "vitest";
import type { MarketPeriodBucket } from "./marketPeriodBuckets";
import { buildMarketRows, isEmptyBucket } from "./pnlMarketRows";
import { PORTFOLIO_PL_PERIODS, type PortfolioPlPeriod } from "./seerIndexerPortfolio";

const MARKET_A = "0xAAAA000000000000000000000000000000000001";
const MARKET_B = "0xbbbb000000000000000000000000000000000002";

function bucket(over: Partial<MarketPeriodBucket> = {}): MarketPeriodBucket {
  return {
    marketId: MARKET_A,
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

const build = (byMarketPeriod: Record<PortfolioPlPeriod, MarketPeriodBucket[]>, priceUsd = 2) =>
  buildMarketRows({
    account: "0xABCDEF0000000000000000000000000000000001",
    chainId: 100,
    byMarketPeriod,
    periods: PORTFOLIO_PL_PERIODS,
    startTimeByPeriod: perPeriod(1_000),
    endTime: 2_000,
    collateralPriceUsd: priceUsd,
    writtenAt: "2026-08-28T00:00:00.000Z",
  });

describe("isEmptyBucket", () => {
  it("treats an all-zero untraded bucket as empty", () => {
    expect(isEmptyBucket(bucket())).toBe(true);
  });

  it("keeps a bucket that only carries a position", () => {
    expect(isEmptyBucket(bucket({ valueEndMtm: 3 }))).toBe(false);
  });

  it("keeps a traded bucket even when every amount nets to zero", () => {
    expect(isEmptyBucket(bucket({ traded: true }))).toBe(false);
  });
});

describe("buildMarketRows", () => {
  it("emits one row per market and period, lowercasing the keys", () => {
    const rows = build(perPeriod([bucket({ valueEndMtm: 5, pnl: 5 }), bucket({ marketId: MARKET_B, pnl: 1 })]));

    expect(rows).toHaveLength(2 * PORTFOLIO_PL_PERIODS.length);
    expect(rows[0].address).toBe("0xabcdef0000000000000000000000000000000001");
    expect(rows[0].market_id).toBe(MARKET_A.toLowerCase());
    expect(new Set(rows.map((r) => r.period))).toEqual(new Set(PORTFOLIO_PL_PERIODS));
  });

  it("stores value_* as mtm + router cumulative, keeping both halves", () => {
    const rows = build(
      perPeriod([
        bucket({ valueStartMtm: 4, valueEndMtm: 9, routerPrimaryCumStart: -1, routerPrimaryCumEnd: -6, pnl: 0 }),
      ]),
    );
    const row = rows[0];

    expect(row.value_start).toBe(3);
    expect(row.value_end).toBe(3);
    expect(row.value_start_mtm).toBe(4);
    expect(row.router_primary_cum_end).toBe(-6);
  });

  it("converts pnl and volume to USD at the refresh price", () => {
    const rows = build(perPeriod([bucket({ pnl: 7, volume: 10 })]), 3);

    expect(rows[0].pnl_usd).toBe(21);
    expect(rows[0].volume_usd).toBe(30);
    expect(rows[0].collateral_price_usd).toBe(3);
  });

  it("drops empty buckets so the table stays sparse", () => {
    const rows = build(perPeriod([bucket(), bucket({ marketId: MARKET_B, pnl: 2 })]));

    expect(rows).toHaveLength(PORTFOLIO_PL_PERIODS.length);
    expect(rows.every((r) => r.market_id === MARKET_B)).toBe(true);
  });

  it("stamps the same window on every row of a period, so sums are reconcilable", () => {
    const rows = build(perPeriod([bucket({ pnl: 1 }), bucket({ marketId: MARKET_B, pnl: 1 })]));
    const forAll = rows.filter((r) => r.period === "all");

    expect(new Set(forAll.map((r) => r.window_start))).toEqual(new Set([1_000]));
    expect(new Set(forAll.map((r) => r.window_end))).toEqual(new Set([2_000]));
  });

  it("returns nothing when the wallet has no non-empty bucket anywhere", () => {
    expect(build(perPeriod([bucket()]))).toEqual([]);
  });
});
