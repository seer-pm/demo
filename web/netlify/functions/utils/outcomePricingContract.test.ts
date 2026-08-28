import { getToken0Token1 } from "@seer-pm/sdk/market-pools";
import type { Address } from "viem";
import { zeroAddress } from "viem";
import { describe, expect, it } from "vitest";
import { effectivePricesByToken } from "./marketMtmRefresh";
import { type OutcomePriceToken, type PairMids, mapOutcomePrices, setPairMid } from "./outcomePrices";

/**
 * The pricing contract both P/L paths must honour.
 *
 * `computePortfolioPlAllPeriods` prices a wallet's whole portfolio at once; the market-driven MTM
 * loop prices one market at a time. Every disagreement between them so far came from one of the
 * three rules below being satisfied by one path and not the other, and each one silently produced a
 * price of 0 rather than an error. These tests pin the rules so the next divergence fails here
 * instead of in production data.
 */

const COLLATERAL = "0xaf204776c7245bf4147c2612bf6e5972ee483701" as Address;
const ROOT_YES = "0x1111000000000000000000000000000000000001" as Address;
const ROOT_NO = "0x1111000000000000000000000000000000000002" as Address;
/** A conditional market's collateral IS a parent outcome token, not the primary collateral. */
const PARENT_OUTCOME = ROOT_YES;
const CHILD_YES = "0x2222000000000000000000000000000000000001" as Address;

/** `price` is how much of `quote` one unit of `base` is worth, matching `getMid(mids, base, quote)`. */
function mids(pairs: Array<[string, string, number]>): PairMids {
  const m: PairMids = new Map();
  for (const [base, quote, price] of pairs) {
    const { token0 } = getToken0Token1(base as Address, quote as Address);
    const baseIsToken0 = token0 === base.toLowerCase();
    setPairMid(m, base, quote, {
      token1PerToken0: baseIsToken0 ? price : 1 / price,
      token0PerToken1: baseIsToken0 ? 1 / price : price,
    });
  }
  return m;
}

describe("root markets", () => {
  const tokens = (parentMarketId?: string): OutcomePriceToken[] => [
    { tokenId: ROOT_YES, collateralToken: COLLATERAL, parentMarketId },
    { tokenId: ROOT_NO, collateralToken: COLLATERAL, parentMarketId },
  ];
  const pool = mids([
    [ROOT_YES, COLLATERAL, 0.6],
    [ROOT_NO, COLLATERAL, 0.4],
  ]);

  it("prices against the collateral when parentMarketId is undefined", () => {
    const prices = mapOutcomePrices(tokens(undefined), pool);
    expect(prices[ROOT_YES]).toBeCloseTo(0.6, 10);
    expect(prices[ROOT_NO]).toBeCloseTo(0.4, 10);
  });

  it("prices everything at zero when the zero address is passed as the parent", () => {
    // The bug: a root market has no parent, but `market.parentMarket.id` is the zero address rather
    // than undefined. `mapOutcomePrices` reads any value as "quote against the parent's token",
    // looks for a price it was never given, and lands on 0 without complaining.
    const prices = mapOutcomePrices(tokens(zeroAddress), pool);
    expect(prices[ROOT_YES]).toBe(0);
    expect(prices[ROOT_NO]).toBe(0);
  });
});

describe("conditional markets", () => {
  // The child trades against the parent outcome token, so its absolute price is relative x parent.
  const childOnly: OutcomePriceToken[] = [
    { tokenId: CHILD_YES, collateralToken: PARENT_OUTCOME, parentMarketId: "0xparent" },
  ];
  const withParent: OutcomePriceToken[] = [{ tokenId: PARENT_OUTCOME, collateralToken: COLLATERAL }, ...childOnly];
  const pool = mids([
    [PARENT_OUTCOME, COLLATERAL, 0.5],
    [CHILD_YES, PARENT_OUTCOME, 0.8],
  ]);

  it("needs the parent outcome token in the same batch", () => {
    expect(mapOutcomePrices(withParent, pool)[CHILD_YES]).toBeCloseTo(0.4, 10);
  });

  it("prices the child at zero when the batch holds only that market's tokens", () => {
    // This is why a strictly per-market price batch cannot value conditional outcomes: the parent's
    // token belongs to a different market, so a market-shaped loop must price the parent chain too.
    expect(mapOutcomePrices(childOnly, pool)[CHILD_YES]).toBe(0);
  });
});

describe("resolved markets", () => {
  it("has no pool, so the pool price alone is zero", () => {
    const tokens: OutcomePriceToken[] = [{ tokenId: ROOT_YES, collateralToken: COLLATERAL }];
    expect(mapOutcomePrices(tokens, mids([]))[ROOT_YES]).toBe(0);
  });

  it("must be valued at the settled payout instead", () => {
    const prices = effectivePricesByToken({
      tokens: [ROOT_YES, ROOT_NO],
      redeemedByToken: { [ROOT_YES]: 1, [ROOT_NO]: 0 },
      currentByToken: mapOutcomePrices([{ tokenId: ROOT_YES, collateralToken: COLLATERAL }], mids([])),
    });
    expect(prices[ROOT_YES]).toBe(1);
    expect(prices[ROOT_NO]).toBe(0);
  });
});
