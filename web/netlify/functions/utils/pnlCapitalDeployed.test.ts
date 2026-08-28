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

// Distinct log index per event: legs sharing an id are the duplicate-market fan-out and get
// collapsed by `dedupeConditionalEventLegs`, which is not what these cases are exercising.
let logIndex = 0;

function event(
  partial: Partial<ConditionalEventRow> & Pick<ConditionalEventRow, "eventType" | "amount" | "collateral">,
): ConditionalEventRow {
  return {
    id: `10:0xabc-${logIndex++}-10:0x1`,
    marketId: "0x1",
    marketEntityId: "10:0x1",
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
    // capital_deployed is the whole denominator: the peak at risk already includes any position
    // open when the window started, so value_start must not be added on top.
    const capital = capitalUsdFromRow({ capitalDeployed: 20, collateralPriceUsd: 2 });
    expect(capital).toBe(40);

    expect(computeRoiUsd({ pnlUsd: 30, capitalDeployed: 20, collateralPriceUsd: 2 })).toBe(0.75);
  });

  it("returns null ROI when capital is dust", () => {
    expect(computeRoiUsd({ pnlUsd: 1, capitalDeployed: 0, collateralPriceUsd: 1 })).toBeNull();
  });
});
