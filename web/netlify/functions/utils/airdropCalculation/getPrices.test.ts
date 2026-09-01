import type { Address } from "viem";
import { describe, expect, it } from "vitest";
import type { PoolHourData } from "./getPoolHourDatas";
import { buildPoolStateAt, computePrices } from "./getPrices";

const COLLATERAL = "0x00000000000000000000000000000000000000cc" as Address;
const PARENT = "0x00000000000000000000000000000000000000aa" as Address;
const CHILD = "0x00000000000000000000000000000000000000bb" as Address;
const GRANDCHILD = "0x00000000000000000000000000000000000000dd" as Address;

/**
 * A candle for the canonical (token0, token1) ordering of the pair. token1Price is token1 per
 * token0, so the price OF token0 quoted in token1 is token1Price.
 */
function candle(a: string, b: string, priceOfAInB: number, periodStartUnix: number, poolId = "pool"): PoolHourData {
  const [token0, token1] = a < b ? [a, b] : [b, a];
  const token1Price = a === token0 ? priceOfAInB : 1 / priceOfAInB;
  return {
    id: `${poolId}-${periodStartUnix}`,
    token0Price: String(1 / token1Price),
    token1Price: String(token1Price),
    periodStartUnix,
    sqrtPrice: null,
    liquidity: null,
    pool: { id: poolId, liquidity: null, token0: { id: token0, name: null }, token1: { id: token1, name: null } },
  };
}

/** `buildPoolStateAt` expects newest-first, matching what getAllPoolHourDatas returns. */
function sortDesc(candles: PoolHourData[]) {
  return [...candles].sort((x, y) => y.periodStartUnix - x.periodStartUnix);
}

describe("computePrices", () => {
  it("prices a top-level outcome token against its collateral", () => {
    const prices = computePrices(
      sortDesc([candle(PARENT, COLLATERAL, 0.4, 100)]),
      [{ tokenId: PARENT, collateralToken: COLLATERAL }],
      200,
    );
    expect(prices[PARENT.toLowerCase()]).toBeCloseTo(0.4, 12);
  });

  it("chains a conditional token through its parent", () => {
    const prices = computePrices(
      sortDesc([candle(PARENT, COLLATERAL, 0.4, 100), candle(CHILD, PARENT, 0.5, 100)]),
      [
        { tokenId: PARENT, collateralToken: COLLATERAL },
        { tokenId: CHILD, parentTokenId: PARENT, collateralToken: COLLATERAL },
      ],
      200,
    );
    expect(prices[CHILD.toLowerCase()]).toBeCloseTo(0.4 * 0.5, 12);
  });

  it("chains three levels deep", () => {
    // THE REGRESSION TEST. The previous implementation looked parents up in a map built only from
    // non-conditional tokens, so a token whose parent was itself conditional priced at 0.
    const prices = computePrices(
      sortDesc([
        candle(PARENT, COLLATERAL, 0.4, 100),
        candle(CHILD, PARENT, 0.5, 100),
        candle(GRANDCHILD, CHILD, 0.25, 100),
      ]),
      [
        { tokenId: PARENT, collateralToken: COLLATERAL },
        { tokenId: CHILD, parentTokenId: PARENT, collateralToken: COLLATERAL },
        { tokenId: GRANDCHILD, parentTokenId: CHILD, collateralToken: COLLATERAL },
      ],
      200,
    );
    expect(prices[GRANDCHILD.toLowerCase()]).toBeCloseTo(0.4 * 0.5 * 0.25, 12);
  });

  it("prices a token at 0 when its pool has no candle at or before the snapshot", () => {
    const prices = computePrices(
      sortDesc([candle(PARENT, COLLATERAL, 0.4, 500)]),
      [{ tokenId: PARENT, collateralToken: COLLATERAL }],
      200,
    );
    expect(prices[PARENT.toLowerCase()]).toBe(0);
  });

  it("prices a conditional token at 0 when its parent is missing from the token set", () => {
    const prices = computePrices(
      sortDesc([candle(CHILD, PARENT, 0.5, 100)]),
      [{ tokenId: CHILD, parentTokenId: PARENT, collateralToken: COLLATERAL }],
      200,
    );
    expect(prices[CHILD.toLowerCase()]).toBe(0);
  });

  it("survives a parent cycle instead of recursing forever", () => {
    const prices = computePrices(
      sortDesc([candle(CHILD, PARENT, 0.5, 100), candle(PARENT, CHILD, 2, 100)]),
      [
        { tokenId: PARENT, parentTokenId: CHILD, collateralToken: COLLATERAL },
        { tokenId: CHILD, parentTokenId: PARENT, collateralToken: COLLATERAL },
      ],
      200,
    );
    expect(prices[CHILD.toLowerCase()]).toBe(0);
    expect(prices[PARENT.toLowerCase()]).toBe(0);
  });
});

describe("buildPoolStateAt", () => {
  it("takes the newest candle at or before the snapshot", () => {
    const state = buildPoolStateAt(
      sortDesc([candle(PARENT, COLLATERAL, 0.1, 100), candle(PARENT, COLLATERAL, 0.9, 300)]),
      200,
    );
    const [entry] = [...state.values()];
    expect(entry.periodStartUnix).toBe(100);
  });

  it("has no staleness bound — an ancient candle still counts", () => {
    const state = buildPoolStateAt(sortDesc([candle(PARENT, COLLATERAL, 0.1, 1)]), 10_000_000);
    expect(state.size).toBe(1);
  });

  it("breaks same-hour fee-tier ties deterministically by pool id", () => {
    const state = buildPoolStateAt(
      sortDesc([candle(PARENT, COLLATERAL, 0.1, 100, "zzz"), candle(PARENT, COLLATERAL, 0.9, 100, "aaa")]),
      200,
    );
    expect([...state.values()][0].pool.id).toBe("aaa");
  });
});
