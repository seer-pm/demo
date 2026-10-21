import type { PortfolioMarketPnLRow } from "@seer-pm/sdk";
import { describe, expect, it } from "vitest";
import { indexMarketPnl, marketPnlKey } from "./marketPnl";

const MARKET = "0x95149FCC1eb9ec665a5984c33927b991dd66a355";
const OWNER = "0xC70402ecd3C8b1cf35eEe9837e13053B54e5E45A";
const EXECUTOR = "0x1111111111111111111111111111111111111111";

function row(over: Partial<PortfolioMarketPnLRow>): PortfolioMarketPnLRow {
  return {
    chainId: 100,
    marketId: MARKET.toLowerCase() as PortfolioMarketPnLRow["marketId"],
    address: OWNER.toLowerCase() as PortfolioMarketPnLRow["address"],
    pnl: 0,
    pnlUsd: 0,
    volume: 0,
    volumeUsd: 0,
    capitalDeployed: 0,
    collateralPriceUsd: 1,
    traded: true,
    updatedAt: "2026-10-17T00:00:00Z",
    ...over,
  };
}

describe("indexMarketPnl", () => {
  it("matches a checksummed position against the lowercased stored row", () => {
    const byKey = indexMarketPnl([row({ volume: 12.5, pnl: -1.25 })]);
    expect(byKey.get(marketPnlKey(100, MARKET, OWNER))).toMatchObject({ volume: 12.5, pnl: -1.25 });
  });

  it("keeps an owner and its executor apart on the same market", () => {
    const byKey = indexMarketPnl([
      row({ volume: 10 }),
      row({ address: EXECUTOR as PortfolioMarketPnLRow["address"], volume: 30 }),
    ]);
    expect(byKey.get(marketPnlKey(100, MARKET, OWNER))?.volume).toBe(10);
    expect(byKey.get(marketPnlKey(100, MARKET, EXECUTOR))?.volume).toBe(30);
  });

  it("keeps the same market apart per chain", () => {
    const byKey = indexMarketPnl([row({ chainId: 100, volume: 1 }), row({ chainId: 1, volume: 2 })]);
    expect(byKey.get(marketPnlKey(1, MARKET, OWNER))?.volume).toBe(2);
    expect(byKey.get(marketPnlKey(10, MARKET, OWNER))).toBeUndefined();
  });
});
