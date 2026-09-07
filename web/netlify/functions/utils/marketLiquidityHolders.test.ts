import type { Address } from "viem";
import { describe, expect, it } from "vitest";
import type { LiquidityLeg } from "./dexLiquidityPositions";
import { liquidityBalancesFromLegs, mergeTokenHolders, tokensFromLiquidityLegs } from "./marketLiquidityHolders";

const TOKEN = "0x0000000000000000000000000000000000000001";
const ALICE = "0x0000000000000000000000000000000000000002" as Address;
const BOB = "0x0000000000000000000000000000000000000003" as Address;
const POOL = "0x0000000000000000000000000000000000000004" as Address;

describe("mergeTokenHolders", () => {
  it("adds direct and LP balances and sorts the result", () => {
    const result = mergeTokenHolders(
      { [TOKEN]: [{ address: ALICE, balance: "10" }] },
      {
        [TOKEN]: [
          { address: ALICE, balance: "5" },
          { address: BOB, balance: "20" },
        ],
      },
      [],
    );

    expect(result[TOKEN]).toEqual([
      { address: BOB, balance: "20" },
      { address: ALICE, balance: "15" },
    ]);
  });

  it("excludes pool contract balances", () => {
    const result = mergeTokenHolders(
      {
        [TOKEN]: [
          { address: POOL, balance: "100" },
          { address: ALICE, balance: "10" },
        ],
      },
      { [TOKEN]: [{ address: BOB, balance: "20" }] },
      [POOL],
    );

    expect(result[TOKEN]).toEqual([
      { address: BOB, balance: "20" },
      { address: ALICE, balance: "10" },
    ]);
  });
});

const OUTCOME = "0x0000000000000000000000000000000000000010";
const COLLATERAL = "0x0000000000000000000000000000000000000011";
// token1Price 1: the pool sits at tick 0, in the middle of the range below.
const SQRT_PRICE_AT_TICK_0 = 79228162514264337593543950336n;

function leg(over: Partial<LiquidityLeg> = {}): LiquidityLeg {
  return {
    id: "1",
    owner: ALICE.toLowerCase(),
    poolId: POOL.toLowerCase(),
    sqrtPrice: SQRT_PRICE_AT_TICK_0,
    token0: OUTCOME,
    token1: COLLATERAL,
    tickLower: -20000,
    tickUpper: 20000,
    liquidity: 10n ** 20n,
    ...over,
  };
}

describe("liquidityBalancesFromLegs", () => {
  const outcomes = new Set([OUTCOME]);

  it("credits the outcome side of a position to its owner", () => {
    const balances = liquidityBalancesFromLegs([leg()], outcomes);
    expect([...balances.keys()]).toEqual([ALICE.toLowerCase()]);
    expect(balances.get(ALICE.toLowerCase())?.get(OUTCOME)).toBeGreaterThan(0n);
  });

  it("leaves the collateral side out", () => {
    const balances = liquidityBalancesFromLegs([leg()], outcomes);
    expect(balances.get(ALICE.toLowerCase())?.has(COLLATERAL)).toBe(false);
  });

  it("sums a wallet's positions in the same token", () => {
    const one = liquidityBalancesFromLegs([leg()], outcomes).get(ALICE.toLowerCase())?.get(OUTCOME);
    const two = liquidityBalancesFromLegs([leg(), leg({ id: "2" })], outcomes)
      .get(ALICE.toLowerCase())
      ?.get(OUTCOME);
    expect(two).toBe((one as bigint) * 2n);
  });

  it("keeps owners apart", () => {
    const balances = liquidityBalancesFromLegs([leg(), leg({ id: "2", owner: BOB.toLowerCase() })], outcomes);
    expect([...balances.keys()].sort()).toEqual([ALICE.toLowerCase(), BOB.toLowerCase()].sort());
  });

  it("skips a pool with no price and a position with no liquidity", () => {
    expect(liquidityBalancesFromLegs([leg({ sqrtPrice: 0n })], outcomes).size).toBe(0);
    expect(liquidityBalancesFromLegs([leg({ liquidity: 0n })], outcomes).size).toBe(0);
  });

  it("credits nothing for a range the price has left on the collateral side", () => {
    // Price above the range: the position is entirely collateral, so it holds no outcome token.
    const balances = liquidityBalancesFromLegs([leg({ tickLower: -20000, tickUpper: -19000 })], outcomes);
    expect(balances.size).toBe(0);
  });
});

describe("tokensFromLiquidityLegs", () => {
  it("returns both sides of every position, deduped", () => {
    expect(tokensFromLiquidityLegs([leg(), leg({ id: "2" })]).sort()).toEqual([OUTCOME, COLLATERAL].sort());
  });

  it("is empty for no positions", () => {
    expect(tokensFromLiquidityLegs([])).toEqual([]);
  });
});
