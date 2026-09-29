import { getMarketAllPoolsPairs, getOutcomePoolPairs, getToken0Token1 } from "@seer-pm/sdk/market-pools";
import type { Market } from "@seer-pm/sdk/market-types";
import { type Address, zeroAddress } from "viem";
import { describe, expect, it, vi } from "vitest";
import type { Pool } from "./fetchPools";
import { getMarketsLiquidity } from "./getMarketsLiquidity";

// Every collateral quotes at 1.2, except the second futarchy collateral (0.5) and the unquoted one (0),
// so the futarchy tests can tell which leg was valued with which price.
vi.mock("./common.ts", () => ({
  getDexScreenerPriceUSD: async (address: string) => {
    if (address.toLowerCase() === "0x5555000000000000000000000000000000000002") return 0.5;
    if (address.toLowerCase() === "0x5555000000000000000000000000000000000003") return 0;
    return 1.2;
  },
}));
vi.mock("./fetchSUSDSPriceFromContract.ts", () => ({ fetchSUSDSPriceFromContract: async () => 1.1 }));

const GNOSIS = 100;
const SDAI = "0xaf204776c7245bf4147c2612bf6e5972ee483701" as Address;
const SDAI_USD = 1.2;

// Root outcomes sort before child outcomes, which sort before sDAI, so token order is known in every pool.
const ROOT_YES = "0x1111000000000000000000000000000000000001" as Address;
const ROOT_OTHER = "0x1111000000000000000000000000000000000002" as Address;
const CHILD_A = "0x2222000000000000000000000000000000000001" as Address;
const CHILD_OTHER = "0x2222000000000000000000000000000000000002" as Address;
const GRANDCHILD_X = "0x3333000000000000000000000000000000000001" as Address;

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
    outcomesSupply: 0n,
  } as unknown as Market;
}

const ROOT = market("0xroot", [ROOT_YES, ROOT_OTHER], zeroAddress, SDAI);
const CHILD = market("0xchild", [CHILD_A, CHILD_OTHER], ROOT.id as Address, ROOT_OTHER);
const GRANDCHILD = market("0xgrandchild", [GRANDCHILD_X], CHILD.id as Address, CHILD_OTHER);

// Futarchy: wrappedTokens[0] and [1] redeem to collateralToken1, [2] and [3] to collateralToken2.
const FUT_YES_1 = "0x4444000000000000000000000000000000000001" as Address;
const FUT_NO_1 = "0x4444000000000000000000000000000000000002" as Address;
const FUT_YES_2 = "0x4444000000000000000000000000000000000003" as Address;
const FUT_NO_2 = "0x4444000000000000000000000000000000000004" as Address;
const FUT_COLLATERAL_1 = "0x5555000000000000000000000000000000000001" as Address;
const FUT_COLLATERAL_2 = "0x5555000000000000000000000000000000000002" as Address;
const FUT_COLLATERAL_UNQUOTED = "0x5555000000000000000000000000000000000003" as Address;

function futarchyMarket(id: string, collateralToken2: Address): Market {
  return {
    ...market(id, [FUT_YES_1, FUT_NO_1, FUT_YES_2, FUT_NO_2], zeroAddress, zeroAddress),
    type: "Futarchy",
    collateralToken1: FUT_COLLATERAL_1,
    collateralToken2,
  } as unknown as Market;
}

const FUTARCHY = futarchyMarket("0xfutarchy", FUT_COLLATERAL_2);

type Legs = { outcome: number; counterparty: number };

/** A pool where one `outcome` costs `price` units of `counterparty`, with optional lifetime swap volume per side. */
function pool(
  m: Market,
  outcome: Address,
  counterparty: Address,
  price: number,
  balances: Legs,
  volumes: Legs = { outcome: 0, counterparty: 0 },
): Pool {
  const { token0, token1 } = getToken0Token1(outcome, counterparty);
  const outcomeIsToken0 = token0 === outcome.toLowerCase();
  // token0Price is token0 per token1; the tick prices token0 in token1 units.
  const [token0Price, token1Price] = outcomeIsToken0 ? [1 / price, price] : [price, 1 / price];
  const tick = Math.round(Math.log(outcomeIsToken0 ? price : 1 / price) / Math.log(1.0001));
  return {
    id: `${token0}-${token1}`,
    sqrtPrice: "0",
    token0: { id: token0, symbol: outcomeIsToken0 ? "OUT" : "COL", decimals: "18" },
    token1: { id: token1, symbol: outcomeIsToken0 ? "COL" : "OUT", decimals: "18" },
    token0Price: String(token0Price),
    token1Price: String(token1Price),
    volumeToken0: String(outcomeIsToken0 ? volumes.outcome : volumes.counterparty),
    volumeToken1: String(outcomeIsToken0 ? volumes.counterparty : volumes.outcome),
    liquidity: "1",
    tick: String(tick),
    balance0: outcomeIsToken0 ? balances.outcome : balances.counterparty,
    balance1: outcomeIsToken0 ? balances.counterparty : balances.outcome,
    isToken0Collateral: !outcomeIsToken0,
    counterparty,
    chainId: GNOSIS,
    outcomesCountWithoutInvalid: m.wrappedTokens.length - 1,
    market: m,
  };
}

const rootPools = [
  pool(ROOT, ROOT_YES, SDAI, 0.6, { outcome: 100, counterparty: 60 }),
  pool(ROOT, ROOT_OTHER, SDAI, 0.4, { outcome: 100, counterparty: 40 }),
];

describe("getOutcomePoolPairs", () => {
  it("gives a top-level outcome its collateral pair only", () => {
    expect(getOutcomePoolPairs(ROOT, 0)).toEqual([getToken0Token1(ROOT_YES, SDAI)]);
  });

  it("gives a child outcome the parent pair first and the main collateral pair second", () => {
    expect(getOutcomePoolPairs(CHILD, 0)).toEqual([
      getToken0Token1(CHILD_A, ROOT_OTHER),
      getToken0Token1(CHILD_A, SDAI),
    ]);
  });

  it("lists every pair of a market once", () => {
    expect(getMarketAllPoolsPairs(CHILD)).toHaveLength(4);
    expect(getMarketAllPoolsPairs(ROOT)).toHaveLength(2);
  });
});

describe("getMarketsLiquidity on child markets", () => {
  it("values a child outcome through its parent pool, as before", async () => {
    const pools = [...rootPools, pool(CHILD, CHILD_A, ROOT_OTHER, 0.25, { outcome: 40, counterparty: 10 })];
    const result = await getMarketsLiquidity([ROOT, CHILD], pools);

    // (0.25 * 40 + 10) parent tokens, each worth 0.4 sDAI.
    expect(result[CHILD.id].totalLiquidity).toBeCloseTo(20 * 0.4 * SDAI_USD, 6);
    expect(result[CHILD.id].outcomePrices[0]).toBeCloseTo(0.25, 3);
    expect(result[CHILD.id].outcomePrices[1]).toBeNaN();
    expect(result[CHILD.id].collateralPriceInUSD).toBeCloseTo(0.4 * SDAI_USD, 6);
    expect(result[CHILD.id].poolBalance[0]).toEqual({
      token0: { symbol: "COL", balance: 10 },
      token1: { symbol: "OUT", balance: 40 },
    });
  });

  it("values a child outcome that only pools against the main collateral", async () => {
    const pools = [...rootPools, pool(CHILD, CHILD_A, SDAI, 0.1, { outcome: 50, counterparty: 5 })];
    const result = await getMarketsLiquidity([ROOT, CHILD], pools);

    expect(result[CHILD.id].totalLiquidity).toBeCloseTo((0.1 * 50 + 5) * SDAI_USD, 6);
    // The odds take the sDAI price as is, not the conditional 0.1 / 0.4.
    expect(result[CHILD.id].outcomePrices[0]).toBeCloseTo(0.1, 3);
    expect(result[CHILD.id].collateralPriceInUSD).toBeCloseTo(0.4 * SDAI_USD, 6);
    expect(result[CHILD.id].poolBalance[0]).toEqual({
      token0: { symbol: "OUT", balance: 50 },
      token1: { symbol: "COL", balance: 5 },
    });
  });

  it("sums both pools and prices from the parent pool when an outcome has both", async () => {
    const pools = [
      ...rootPools,
      pool(CHILD, CHILD_A, ROOT_OTHER, 0.25, { outcome: 40, counterparty: 10 }),
      pool(CHILD, CHILD_A, SDAI, 0.2, { outcome: 50, counterparty: 5 }),
    ];
    const result = await getMarketsLiquidity([ROOT, CHILD], pools);

    expect(result[CHILD.id].totalLiquidity).toBeCloseTo((20 * 0.4 + (0.2 * 50 + 5)) * SDAI_USD, 6);
    // The main pool alone would say 0.2 / 0.4 = 0.5; the parent pool wins.
    expect(result[CHILD.id].outcomePrices[0]).toBeCloseTo(0.25, 3);
    expect(result[CHILD.id].poolBalance[0]?.token0.symbol).toBe("COL");
  });

  it("prices odds from the main collateral pool even when the parent token has no price", async () => {
    const pools = [pool(CHILD, CHILD_A, SDAI, 0.1, { outcome: 50, counterparty: 5 })];
    const result = await getMarketsLiquidity([CHILD], pools);

    expect(result[CHILD.id].totalLiquidity).toBeCloseTo((0.1 * 50 + 5) * SDAI_USD, 6);
    expect(result[CHILD.id].outcomePrices[0]).toBeCloseTo(0.1, 3);
    // Open interest still needs the parent token's price.
    expect(result[CHILD.id].collateralPriceInUSD).toBe(0);
  });

  it("prices a grandchild through a parent that only has a main collateral pool", async () => {
    const pools = [
      ...rootPools,
      pool(CHILD, CHILD_OTHER, SDAI, 0.2, { outcome: 50, counterparty: 10 }),
      pool(GRANDCHILD, GRANDCHILD_X, CHILD_OTHER, 0.5, { outcome: 20, counterparty: 10 }),
    ];
    const result = await getMarketsLiquidity([ROOT, CHILD, GRANDCHILD], pools);

    // (0.5 * 20 + 10) CHILD_OTHER, each worth 0.2 sDAI.
    expect(result[GRANDCHILD.id].totalLiquidity).toBeCloseTo(20 * 0.2 * SDAI_USD, 6);
    expect(result[GRANDCHILD.id].outcomePrices[0]).toBeCloseTo(0.5, 3);
    expect(result[GRANDCHILD.id].collateralPriceInUSD).toBeCloseTo(0.2 * SDAI_USD, 6);
  });

  it("keeps a top-level market unchanged", async () => {
    const result = await getMarketsLiquidity([ROOT], rootPools);

    expect(result[ROOT.id].totalLiquidity).toBeCloseTo((0.6 * 100 + 60 + 0.4 * 100 + 40) * SDAI_USD, 6);
    expect(result[ROOT.id].outcomePrices[0]).toBeCloseTo(0.6, 3);
    expect(result[ROOT.id].outcomePrices[1]).toBeCloseTo(0.4, 3);
    expect(result[ROOT.id].collateralPriceInUSD).toBe(SDAI_USD);
  });
});

describe("getMarketsLiquidity volume", () => {
  it("splits a top-level pool into the collateral leg (cash) and the outcome leg (notional)", async () => {
    const pools = [
      pool(ROOT, ROOT_YES, SDAI, 0.6, { outcome: 100, counterparty: 60 }, { outcome: 200, counterparty: 90 }),
      pool(ROOT, ROOT_OTHER, SDAI, 0.4, { outcome: 100, counterparty: 40 }, { outcome: 10, counterparty: 4 }),
    ];
    const result = await getMarketsLiquidity([ROOT], pools);

    expect(result[ROOT.id].volumeUSD).toBeCloseTo((90 + 4) * SDAI_USD, 6);
    expect(result[ROOT.id].volumeNotionalUSD).toBeCloseTo((200 + 10) * SDAI_USD, 6);
  });

  it("values a child pool against the parent token at that token's price", async () => {
    const pools = [
      ...rootPools,
      pool(CHILD, CHILD_A, ROOT_OTHER, 0.25, { outcome: 40, counterparty: 10 }, { outcome: 40, counterparty: 10 }),
    ];
    const result = await getMarketsLiquidity([ROOT, CHILD], pools);

    // Parent tokens are worth 0.4 sDAI, and so is the most a child share can pay.
    expect(result[CHILD.id].volumeUSD).toBeCloseTo(10 * 0.4 * SDAI_USD, 6);
    expect(result[CHILD.id].volumeNotionalUSD).toBeCloseTo(40 * 0.4 * SDAI_USD, 6);
    // The child's pool is the child's volume, not the parent's.
    expect(result[ROOT.id].volumeUSD).toBe(0);
  });

  it("values a child pool against the main collateral with a share worth one sDAI", async () => {
    const pools = [
      ...rootPools,
      pool(CHILD, CHILD_A, SDAI, 0.1, { outcome: 50, counterparty: 5 }, { outcome: 50, counterparty: 5 }),
    ];
    const result = await getMarketsLiquidity([ROOT, CHILD], pools);

    expect(result[CHILD.id].volumeUSD).toBeCloseTo(5 * SDAI_USD, 6);
    expect(result[CHILD.id].volumeNotionalUSD).toBeCloseTo(50 * SDAI_USD, 6);
  });

  it("adds up every fee tier of a pair while only the deepest one prices it", async () => {
    const deep = pool(ROOT, ROOT_YES, SDAI, 0.6, { outcome: 100, counterparty: 60 }, { outcome: 100, counterparty: 60 });
    const shallow = {
      ...pool(ROOT, ROOT_YES, SDAI, 0.5, { outcome: 2, counterparty: 1 }, { outcome: 30, counterparty: 15 }),
      id: "shallow",
    };
    const result = await getMarketsLiquidity([ROOT], [deep, shallow, rootPools[1]]);

    expect(result[ROOT.id].volumeUSD).toBeCloseTo((60 + 15) * SDAI_USD, 6);
    expect(result[ROOT.id].volumeNotionalUSD).toBeCloseTo((100 + 30) * SDAI_USD, 6);
    expect(result[ROOT.id].outcomePrices[0]).toBeCloseTo(0.6, 3);
  });

  it("drops the volume of a pool whose parent token has no price", async () => {
    const pools = [
      pool(CHILD, CHILD_A, ROOT_OTHER, 0.25, { outcome: 40, counterparty: 10 }, { outcome: 40, counterparty: 10 }),
      pool(CHILD, CHILD_OTHER, SDAI, 0.1, { outcome: 50, counterparty: 5 }, { outcome: 50, counterparty: 5 }),
    ];
    const result = await getMarketsLiquidity([CHILD], pools);

    // Only the sDAI pool counts.
    expect(result[CHILD.id].volumeUSD).toBeCloseTo(5 * SDAI_USD, 6);
    expect(result[CHILD.id].volumeNotionalUSD).toBeCloseTo(50 * SDAI_USD, 6);
  });

  it("counts a futarchy trade once, as the average of both legs at their own collateral price", async () => {
    // token0 is YES_1 (collateral 1 at 1.2), token1 is YES_2 (collateral 2 at 0.5).
    const pools = [
      pool(FUTARCHY, FUT_YES_1, FUT_YES_2, 1, { outcome: 10, counterparty: 10 }, { outcome: 100, counterparty: 50 }),
    ];
    const result = await getMarketsLiquidity([FUTARCHY], pools);

    const expected = (100 * 1.2) / 2 + (50 * 0.5) / 2;
    expect(result[FUTARCHY.id].volumeUSD).toBeCloseTo(expected, 6);
    expect(result[FUTARCHY.id].volumeNotionalUSD).toBeCloseTo(expected, 6);
  });

  it("uses the priced leg alone when the other futarchy collateral has no quote", async () => {
    const unquoted = futarchyMarket("0xfutarchy-unquoted", FUT_COLLATERAL_UNQUOTED);
    const pools = [
      pool(unquoted, FUT_YES_1, FUT_YES_2, 1, { outcome: 10, counterparty: 10 }, { outcome: 100, counterparty: 50 }),
    ];
    const result = await getMarketsLiquidity([unquoted], pools);

    expect(result[unquoted.id].volumeUSD).toBeCloseTo(100 * 1.2, 6);
    expect(result[unquoted.id].volumeNotionalUSD).toBeCloseTo(100 * 1.2, 6);
  });
});
