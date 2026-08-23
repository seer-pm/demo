import type { Token } from "@seer-pm/sdk";
import { parseUnits } from "viem";
import { describe, expect, it } from "vitest";
import { capitalUsdFromRow, computeRoiUsd } from "./pnlLeaderboardMetrics";
import { type ConditionalEventRow, routerPrimaryNetFromConditionalEvents } from "./seerIndexerPortfolio";

const PRIMARY = "0x00000000000000000000000000000000000000aa" as `0x${string}`;
const OTHER = "0x00000000000000000000000000000000000000bb" as `0x${string}`;

const primary: Token = {
  address: PRIMARY,
  symbol: "USDC",
  decimals: 6,
  chainId: 10,
};

function event(
  partial: Partial<ConditionalEventRow> & Pick<ConditionalEventRow, "eventType" | "amount" | "collateral">,
): ConditionalEventRow {
  return {
    marketId: "0x1",
    marketName: "m",
    blockNumber: 1,
    timestamp: 100,
    transactionHash: "0xabc",
    ...partial,
  };
}

describe("routerPrimaryNetFromConditionalEvents", () => {
  it("returns net and gross splitOut separately", () => {
    const events = [
      event({ eventType: "split", amount: parseUnits("100", 6), collateral: PRIMARY }),
      event({ eventType: "redeem", amount: parseUnits("40", 6), collateral: PRIMARY }),
      event({ eventType: "merge", amount: parseUnits("10", 6), collateral: PRIMARY }),
      // Non-primary collateral ignored
      event({ eventType: "split", amount: parseUnits("999", 6), collateral: OTHER }),
    ];

    const { netHuman, splitOutHuman } = routerPrimaryNetFromConditionalEvents(events, primary);

    expect(splitOutHuman).toBe(100);
    // split −100, redeem +40, merge +10 → net −50
    expect(netHuman).toBe(-50);
  });
});

describe("capitalUsdFromRow / computeRoiUsd", () => {
  it("uses capitalDeployed, not volume", () => {
    const capital = capitalUsdFromRow({
      valueStart: 10,
      capitalDeployed: 20,
      collateralPriceUsd: 2,
    });
    // (10 + 20) * 2
    expect(capital).toBe(60);

    expect(
      computeRoiUsd({
        pnlUsd: 30,
        valueStart: 10,
        capitalDeployed: 20,
        collateralPriceUsd: 2,
      }),
    ).toBe(0.5);
  });

  it("returns null ROI when capital is dust", () => {
    expect(
      computeRoiUsd({
        pnlUsd: 1,
        valueStart: 0,
        capitalDeployed: 0,
        collateralPriceUsd: 1,
      }),
    ).toBeNull();
  });
});
