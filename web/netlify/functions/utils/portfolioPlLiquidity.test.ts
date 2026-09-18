import type { TransactionData } from "@seer-pm/sdk";
import { formatUnits } from "viem";
import { describe, expect, it } from "vitest";
import { getAmountsForLiquidity, getSqrtRatioAtTickX96 } from "./airdropCalculation/utils";
import {
  type PlLiquidityLeg,
  liquidityHoldingsAt,
  liquidityHoldingsByOwner,
  liquidityLegsAt,
  primaryValueByMarket,
} from "./portfolioPlLiquidity";

const YES = "0x053720357c72aea18963ec9712ed645d70b605f6";
const SDAI = "0xaf204776c7245bf4147c2612bf6e5972ee483701";
const OTHER = "0x00000000000000000000000000000000000000ff";
const MARKET = "0xe1793927eb763864967426fe7750ab0dc6f019f3";
const POOL = "0xb328a1e281bcd22fd0a4e8a145afff99126730b1";
const OUTCOMES = new Map([[YES, MARKET]]);

// The position behind issue #494 (0x226a…28cb, NFT 5430): Yes only, above the pool price.
const ISSUE_LEG: PlLiquidityLeg = {
  poolId: POOL,
  token0: YES,
  token1: SDAI,
  tickLower: -1800,
  tickUpper: 2460,
  liquidity: 32053108492858832538575n,
};

const human = (raw: bigint | undefined) => Number(formatUnits(raw ?? 0n, 18));

function lpEvent(over: Partial<TransactionData>): TransactionData {
  return {
    marketName: "",
    marketId: MARKET,
    type: "lp",
    blockNumber: 1,
    collateral: SDAI,
    timestamp: 0,
    token0: YES,
    token1: SDAI,
    poolId: POOL,
    tickLower: ISSUE_LEG.tickLower,
    tickUpper: ISSUE_LEG.tickUpper,
    liquidity: ISSUE_LEG.liquidity.toString(),
    ...over,
  } as TransactionData;
}

describe("liquidityHoldingsAt", () => {
  it("values a one-sided outcome position as outcome tokens only", () => {
    const prices = new Map([[POOL, getSqrtRatioAtTickX96(-1921)]]);
    const lp = liquidityHoldingsAt([ISSUE_LEG], prices, OUTCOMES, SDAI);

    // The 6,727.96 Yes the wallet deposited, and no collateral: P/L should not move on the deposit.
    expect(human(lp.outcomeRawByToken.get(YES))).toBeCloseTo(6727.9558, 3);
    expect(lp.primaryRawByMarket.size).toBe(0);
  });

  it("splits an in-range position into the outcome row and primary for its market", () => {
    const sqrtPrice = getSqrtRatioAtTickX96(0);
    const lp = liquidityHoldingsAt([ISSUE_LEG], new Map([[POOL, sqrtPrice]]), OUTCOMES, SDAI);
    const expected = getAmountsForLiquidity(
      sqrtPrice,
      getSqrtRatioAtTickX96(ISSUE_LEG.tickLower),
      getSqrtRatioAtTickX96(ISSUE_LEG.tickUpper),
      ISSUE_LEG.liquidity,
    );

    expect(lp.outcomeRawByToken.get(YES)).toBe(expected.amount0);
    expect(lp.primaryRawByMarket.get(MARKET)).toBe(expected.amount1);
    expect(primaryValueByMarket(lp, 18).get(MARKET)).toBeCloseTo(human(expected.amount1), 9);
  });

  it("ignores sides that are neither a valued outcome nor primary, and unpriced pools", () => {
    const foreign = { ...ISSUE_LEG, poolId: "0xpool2", token0: OTHER, token1: SDAI };
    const prices = new Map([
      [POOL, 0n],
      ["0xpool2", getSqrtRatioAtTickX96(0)],
    ]);
    const lp = liquidityHoldingsAt([ISSUE_LEG, foreign], prices, OUTCOMES, SDAI);

    expect(lp.outcomeRawByToken.size).toBe(0);
    expect(lp.primaryRawByMarket.size).toBe(0);
  });

  it("groups by owner for market-driven callers", () => {
    const sqrtPrice = getSqrtRatioAtTickX96(-1921);
    const byOwner = liquidityHoldingsByOwner(
      [
        { ...ISSUE_LEG, owner: "0xAA", sqrtPrice },
        { ...ISSUE_LEG, owner: "0xbb", sqrtPrice, liquidity: ISSUE_LEG.liquidity / 2n },
      ],
      OUTCOMES,
      SDAI,
    );

    expect(human(byOwner.get("0xaa")?.outcomeRawByToken.get(YES))).toBeCloseTo(6727.9558, 3);
    expect(human(byOwner.get("0xbb")?.outcomeRawByToken.get(YES))).toBeCloseTo(6727.9558 / 2, 3);
  });
});

describe("liquidityLegsAt", () => {
  const END = 2_000;

  it("rolls back a mint made inside the window", () => {
    const legs = liquidityLegsAt([ISSUE_LEG], [lpEvent({ timestamp: 1_500 })], 1_000, END);
    expect(legs).toEqual([]);
  });

  it("keeps liquidity minted before the window start", () => {
    const legs = liquidityLegsAt([ISSUE_LEG], [lpEvent({ timestamp: 500 })], 1_000, END);
    expect(legs).toEqual([ISSUE_LEG]);
  });

  it("restores a position burned inside the window, even though it no longer exists", () => {
    const legs = liquidityLegsAt([], [lpEvent({ type: "lp-burn", timestamp: 1_500 })], 1_000, END);
    expect(legs).toEqual([ISSUE_LEG]);
  });

  it("nets partial mints against the same range", () => {
    // The issue wallet opened the position in two mints (100 + 6,627.96 Yes): only the one inside
    // the window is rolled back.
    const small = ISSUE_LEG.liquidity / 64n;
    const legs = liquidityLegsAt(
      [ISSUE_LEG],
      [
        lpEvent({ timestamp: 500, liquidity: small.toString() }),
        lpEvent({ timestamp: 1_500, liquidity: (ISSUE_LEG.liquidity - small).toString() }),
      ],
      1_000,
      END,
    );
    expect(legs).toEqual([{ ...ISSUE_LEG, liquidity: small }]);
  });

  it("ignores events after the end of the window and events without liquidity data", () => {
    const legs = liquidityLegsAt(
      [ISSUE_LEG],
      [lpEvent({ timestamp: END + 1 }), lpEvent({ timestamp: 1_500, liquidity: undefined })],
      1_000,
      END,
    );
    expect(legs).toEqual([ISSUE_LEG]);
  });

  it("drops a range that nets negative", () => {
    const legs = liquidityLegsAt([], [lpEvent({ timestamp: 1_500 })], 1_000, END);
    expect(legs).toEqual([]);
  });
});
