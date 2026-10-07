import { type Market, type OutcomePricePool, getOutcomePricesFromPools, getToken0Token1 } from "@seer-pm/sdk";
import { type Address, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

const GNOSIS = 100;
const SDAI = "0xaf204776c7245bf4147c2612bf6e5972ee483701" as Address;

const ROOT_YES = "0x1111000000000000000000000000000000000001" as Address;
const ROOT_OTHER = "0x1111000000000000000000000000000000000002" as Address;
const CHILD_A = "0x2222000000000000000000000000000000000001" as Address;
const CHILD_OTHER = "0x2222000000000000000000000000000000000002" as Address;

function market(id: string, wrappedTokens: Address[], parentMarketId: Address, collateralToken: Address): Market {
  return {
    id,
    chainId: GNOSIS,
    type: "Generic",
    wrappedTokens,
    collateralToken,
    collateralToken1: zeroAddress,
    collateralToken2: zeroAddress,
    parentMarket: { id: parentMarketId },
  } as unknown as Market;
}

const ROOT = market("0xroot", [ROOT_YES, ROOT_OTHER], zeroAddress, SDAI);
const CHILD = market("0xchild", [CHILD_A, CHILD_OTHER], ROOT.id as Address, ROOT_OTHER);

/** A pool where one `outcome` costs `price` units of `counterparty`. The tick prices token0 in token1. */
function pool(outcome: Address, counterparty: Address, price: number, liquidity: bigint): OutcomePricePool {
  const { token0, token1 } = getToken0Token1(outcome, counterparty);
  const outcomeIsToken0 = token0 === outcome.toLowerCase();
  const tick = Math.round(Math.log(outcomeIsToken0 ? price : 1 / price) / Math.log(1.0001));
  return { token0, token1, liquidity, tick };
}

function expectPrices(actual: number[], expected: number[]) {
  expect(actual.length).toBe(expected.length);
  actual.forEach((price, i) => {
    if (Number.isNaN(expected[i])) {
      expect(price).toBeNaN();
    } else {
      expect(price).toBeCloseTo(expected[i], 3);
    }
  });
}

describe("getOutcomePricesFromPools", () => {
  it("prices a root market from its collateral pools", () => {
    const pools = [pool(ROOT_YES, SDAI, 0.6, 10n), pool(ROOT_OTHER, SDAI, 0.4, 10n)];
    expectPrices(getOutcomePricesFromPools(ROOT, pools), [0.6, 0.4]);
  });

  it("returns NaN for an outcome without a pool", () => {
    expectPrices(getOutcomePricesFromPools(ROOT, [pool(ROOT_YES, SDAI, 0.6, 10n)]), [0.6, Number.NaN]);
  });

  it("prefers the parent pool of a child outcome over its main collateral pool", () => {
    const pools = [pool(CHILD_A, ROOT_OTHER, 0.7, 5n), pool(CHILD_A, SDAI, 0.28, 50n)];
    expectPrices(getOutcomePricesFromPools(CHILD, pools), [0.7, Number.NaN]);
  });

  it("falls back to the main collateral pool when the parent pool is empty or missing", () => {
    const pools = [
      pool(CHILD_A, ROOT_OTHER, 0.7, 0n),
      pool(CHILD_A, SDAI, 0.28, 50n),
      pool(CHILD_OTHER, SDAI, 0.12, 50n),
    ];
    expectPrices(getOutcomePricesFromPools(CHILD, pools), [0.28, 0.12]);
  });

  it("skips a pool without a tick", () => {
    const pools = [{ ...pool(ROOT_YES, SDAI, 0.6, 10n), tick: null }];
    expectPrices(getOutcomePricesFromPools(ROOT, pools), [Number.NaN, Number.NaN]);
  });

  it("takes the deepest pool of a pair", () => {
    const pools = [pool(ROOT_YES, SDAI, 0.9, 1n), pool(ROOT_YES, SDAI, 0.6, 100n), pool(ROOT_YES, SDAI, 0.3, 2n)];
    expectPrices(getOutcomePricesFromPools(ROOT, pools), [0.6, Number.NaN]);
  });

  it("matches pool addresses regardless of case", () => {
    const p = pool(ROOT_YES, SDAI, 0.6, 10n);
    const upper = { ...p, token0: p.token0.toUpperCase().replace("0X", "0x") as Address };
    expectPrices(getOutcomePricesFromPools(ROOT, [upper]), [0.6, Number.NaN]);
  });
});
