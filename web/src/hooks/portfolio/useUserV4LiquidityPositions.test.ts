import { getOrderBookPoolParams, getV4PoolId } from "@seer-pm/order-book";
import type { V4Position } from "@seer-pm/order-book/v4";
import type { Market } from "@seer-pm/sdk";
import { base } from "viem/chains";
import { describe, expect, it } from "vitest";
import { indexMarketsByToken, resolvePositionMarket } from "./useUserV4LiquidityPositions";

const COLLATERAL = "0x0000000000000000000000000000000000000003";
const YES = "0x0000000000000000000000000000000000000002";
const NO = "0x0000000000000000000000000000000000000001";
const CHILD_YES = "0x0000000000000000000000000000000000000005";
const CHILD_NO = "0x0000000000000000000000000000000000000004";

const parent = {
  id: "0xparent",
  chainId: base.id,
  type: "Generic",
  collateralToken: COLLATERAL,
  wrappedTokens: [YES, NO],
} as unknown as Market;

// Conditional market: its collateral is the parent's YES token.
const child = {
  id: "0xchild",
  chainId: base.id,
  type: "Generic",
  collateralToken: YES,
  wrappedTokens: [CHILD_YES, CHILD_NO],
} as unknown as Market;

function positionIn(market: Market, outcomeIndex: number): V4Position {
  const { poolKey } = getOrderBookPoolParams(market, outcomeIndex);
  return {
    tokenId: 1n,
    owner: "0x000000000000000000000000000000000000dead",
    poolId: getV4PoolId(poolKey),
    poolKey,
    tickLower: -120,
    tickUpper: 120,
    liquidity: 1n,
  };
}

describe("resolvePositionMarket", () => {
  const marketsByToken = indexMarketsByToken([parent, child]);

  it("resolves a position to the market and outcome whose pool key matches", () => {
    const resolved = resolvePositionMarket(positionIn(parent, 1), marketsByToken);
    expect(resolved?.market.id).toBe("0xparent");
    expect(resolved?.outcomeIndex).toBe(1);
    expect(resolved?.outcomeIsToken0).toBe(getOrderBookPoolParams(parent, 1).outcomeIsToken0);
  });

  it("resolves a conditional-market pool to the child, not to the parent outcome used as collateral", () => {
    const resolved = resolvePositionMarket(positionIn(child, 0), marketsByToken);
    expect(resolved?.market.id).toBe("0xchild");
    expect(resolved?.outcomeIndex).toBe(0);
  });

  it("returns null when no market reproduces the pool id", () => {
    const stray = { ...positionIn(parent, 0), poolId: `0x${"ab".repeat(32)}` as const };
    expect(resolvePositionMarket(stray, marketsByToken)).toBeNull();
  });

  it("skips markets without order-book support", () => {
    const futarchy = { ...parent, id: "0xfutarchy", type: "Futarchy" } as unknown as Market;
    expect(resolvePositionMarket(positionIn(parent, 0), indexMarketsByToken([futarchy]))).toBeNull();
  });
});
