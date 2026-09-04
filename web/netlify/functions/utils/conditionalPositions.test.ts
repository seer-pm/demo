import type { SupportedChain } from "@seer-pm/sdk";
import { isParentBranchLost } from "@seer-pm/sdk/market";
import type { Market, Question } from "@seer-pm/sdk/market-types";
import { type Address, zeroAddress } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The wallet that motivated this file held 31,662 tokens of a market conditional on
 * "consensys/gnark-crypto", a branch its parent had already decided against — and the portfolio
 * priced them at $0.83 each, for $183k of value that could never be redeemed. Two independent
 * defects had to line up for that: the parent payout was only consulted once the *child* market
 * closed, and the child's price was read straight off its pool without the parent leg that turns a
 * relative quote into a collateral price.
 */

const GNOSIS = 100 as SupportedChain;
const COLLATERAL = "0xaf204776c7245bf4147c2612bf6e5972ee483701" as Address;
const PARENT_ID = "0x0000000000000000000000000000000000000aaa" as Address;
const CHILD_ID = "0x0000000000000000000000000000000000000bbb" as Address;
const GRANDCHILD_ID = "0x0000000000000000000000000000000000000ccc" as Address;
const PARENT_WON = "0x1111000000000000000000000000000000000001" as Address;
const PARENT_LOST = "0x1111000000000000000000000000000000000002" as Address;
const CHILD_YES = "0x2222000000000000000000000000000000000001" as Address;
const CHILD_NO = "0x2222000000000000000000000000000000000002" as Address;

// `./markets` builds a Supabase client at import time and `getMarketsMappings` (pure, and used by
// the builder under test) lives in it, so the module is loaded for real with placeholder
// credentials rather than stubbed wholesale. Nothing here reaches the network: the one function
// that would, `searchAllMarkets`, is replaced below.
process.env.SUPABASE_PROJECT_URL ||= "http://supabase.test";
process.env.SUPABASE_API_KEY ||= "test-key";

const searchAllMarkets = vi.fn();
vi.mock("./markets", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./markets")>()),
  searchAllMarkets: (...args: unknown[]) => searchAllMarkets(...args),
}));

const getCurrentOutcomePrices = vi.fn();
vi.mock("./onchainOutcomePrices", () => ({
  getCurrentOutcomePrices: (...args: unknown[]) => getCurrentOutcomePrices(...args),
}));

vi.mock("./tokenDecimals", () => ({
  getTokenDecimalsList: (_chainId: SupportedChain, tokens: string[]) => tokens.map(() => 18),
}));

const { buildPortfolioPositionsCore } = await import("./buildPortfolioPositions");
const { loadMarketsWithAncestors, marketsWithLocalAncestors, pricedMarketsRootFirst } = await import(
  "./marketParentChain"
);
const { settledPayoutRatios } = await import("./outcomePrices");
const { outcomePriceInputsForPositions, repricePortfolioPositions } = await import("./buildPortfolioPositions");
const { getHistoryTokensPricesForPortfolio } = await import("./dexPoolHourPrices");

const HOUR = 3600;
const nowTs = () => Math.floor(Date.now() / 1000);

function question(overrides: Partial<Question> = {}): Question {
  return {
    id: "0x000",
    arbitrator: zeroAddress,
    opening_ts: nowTs() - 30 * 24 * HOUR,
    timeout: 129600,
    finalize_ts: 0,
    is_pending_arbitration: false,
    best_answer: "0x00",
    bond: 0n,
    min_bond: 0n,
    base_question: "0x00",
    ...overrides,
  };
}

/** An answered, finalized question — what a market needs to read as CLOSED. */
const settledQuestion = question({ finalize_ts: nowTs() - HOUR });

function market(overrides: Partial<Market>): Market {
  return {
    id: zeroAddress,
    type: "Generic",
    marketName: "",
    outcomes: ["Yes", "No"],
    collateralToken: COLLATERAL,
    collateralToken1: zeroAddress,
    collateralToken2: zeroAddress,
    wrappedTokens: [],
    parentMarket: { id: zeroAddress, conditionId: "0x0", payoutReported: false, payoutNumerators: [] },
    parentOutcome: 0n,
    parentCollectionId: "0x0",
    conditionId: "0x0",
    questionId: "0x0",
    templateId: 0n,
    questions: [question()],
    openingTs: 0,
    finalizeTs: 0,
    encodedQuestions: [],
    lowerBound: 0n,
    upperBound: 0n,
    payoutReported: false,
    payoutNumerators: [],
    chainId: GNOSIS,
    outcomesSupply: 0n,
    liquidityUSD: 0,
    openInterestUSD: 0,
    maxLiquidity: 0,
    incentive: 0,
    hasLiquidity: false,
    categories: ["misc"],
    poolBalance: [],
    odds: [],
    url: "",
    ...overrides,
  } as Market;
}

/** The parent, settled on `PARENT_WON`. Its other branch is the dead one. */
const PARENT_FINALIZED_TS = nowTs() - HOUR;
const resolvedParent = market({
  id: PARENT_ID,
  marketName: "Which repositories will be evaluated?",
  wrappedTokens: [PARENT_WON, PARENT_LOST],
  questions: [settledQuestion],
  finalizeTs: PARENT_FINALIZED_TS,
  payoutReported: true,
  payoutNumerators: [1n, 0n],
});

/** Child of the branch the parent did NOT pick, still open — the reported case. */
const deadChild = market({
  id: CHILD_ID,
  marketName: "What will the average dependency weight be?",
  collateralToken: PARENT_LOST,
  wrappedTokens: [CHILD_YES, CHILD_NO],
  parentMarket: { id: PARENT_ID, conditionId: "0x0", payoutReported: true, payoutNumerators: [1n, 0n] },
  parentOutcome: 1n,
});

/** Same market, hanging off the branch that won. */
const liveChild = market({
  ...deadChild,
  collateralToken: PARENT_WON,
  parentOutcome: 0n,
});

describe("isParentBranchLost", () => {
  it("is false for a root market, whatever its own payout", () => {
    expect(isParentBranchLost(resolvedParent)).toBe(false);
  });

  it("is false while the parent has not reported", () => {
    const pendingParent = market({
      ...deadChild,
      parentMarket: { id: PARENT_ID, conditionId: "0x0", payoutReported: false, payoutNumerators: [] },
    });
    expect(isParentBranchLost(pendingParent)).toBe(false);
  });

  it("is true once the parent settled on another outcome", () => {
    expect(isParentBranchLost(deadChild)).toBe(true);
  });

  it("is false for the branch the parent actually picked", () => {
    expect(isParentBranchLost(liveChild)).toBe(false);
  });
});

describe("settledPayoutRatios", () => {
  it("reports each outcome's share, including the zero shares", () => {
    expect(settledPayoutRatios([resolvedParent])).toEqual({ [PARENT_WON]: 1, [PARENT_LOST]: 0 });
  });

  it("skips markets that have not reported, so the pool keeps pricing them", () => {
    expect(settledPayoutRatios([deadChild])).toEqual({});
  });

  it("skips a market that had not settled yet at the reference time", () => {
    // Pricing a past moment: last week's payout says nothing about what the outcome was worth a
    // month ago, when it still traded. Without the cutoff the historical leg of a 24h delta gets
    // today's answer and the delta becomes an artefact.
    expect(settledPayoutRatios([resolvedParent], PARENT_FINALIZED_TS - HOUR)).toEqual({});
    expect(settledPayoutRatios([resolvedParent], PARENT_FINALIZED_TS + HOUR)).toEqual({
      [PARENT_WON]: 1,
      [PARENT_LOST]: 0,
    });
  });
});

describe("outcomePriceInputsForPositions", () => {
  beforeEach(() => {
    searchAllMarkets.mockReset();
  });

  const position = { marketId: CHILD_ID, tokenId: CHILD_YES, tokenBalance: 1 } as never;

  it("gives the historical leg the same root-first batch the current leg gets", async () => {
    // The regression this guards: bare positions carry `parentMarketId` but not the parent's
    // tokens, so `mapOutcomePrices` prices every conditional at 0 — and a history leg at 0 against
    // a chained current leg reads as a 100% move that never happened.
    searchAllMarkets.mockResolvedValueOnce({ markets: [liveChild] }).mockResolvedValueOnce({
      markets: [resolvedParent],
    });

    const { tokens, markets } = await outcomePriceInputsForPositions([position], GNOSIS);

    expect(tokens.map((t) => t.tokenId)).toEqual([PARENT_WON, PARENT_LOST, CHILD_YES, CHILD_NO]);
    expect(tokens[0].parentMarketId).toBeUndefined();
    expect(tokens[2].parentMarketId).toBe(PARENT_ID);
    expect(markets.map((m) => m.id).sort()).toEqual([PARENT_ID, CHILD_ID].sort());
  });

  it("queries nothing when the caller already has the markets", async () => {
    const { tokens } = await outcomePriceInputsForPositions([position], GNOSIS, [liveChild, resolvedParent]);

    expect(searchAllMarkets).not.toHaveBeenCalled();
    expect(tokens.map((t) => t.tokenId)).toEqual([PARENT_WON, PARENT_LOST, CHILD_YES, CHILD_NO]);
  });
});

describe("parent chain assembly", () => {
  beforeEach(() => {
    searchAllMarkets.mockReset();
  });

  it("keeps ancestors already in the pool and asks for nothing", async () => {
    const local = marketsWithLocalAncestors([CHILD_ID], [resolvedParent, deadChild]);
    expect(local.map((m) => m.id)).toEqual([CHILD_ID, PARENT_ID]);

    await loadMarketsWithAncestors(local, GNOSIS);
    expect(searchAllMarkets).not.toHaveBeenCalled();
  });

  it("fetches the parent when the wallet's markets do not contain it", async () => {
    // The normal case: splitting consumed the wallet's parent tokens, so resolving markets from
    // holdings alone never returns the parent.
    searchAllMarkets.mockResolvedValueOnce({ markets: [resolvedParent] });

    const chain = await loadMarketsWithAncestors([deadChild], GNOSIS);

    expect(searchAllMarkets).toHaveBeenCalledTimes(1);
    expect(searchAllMarkets.mock.calls[0][0]).toMatchObject({ marketIds: [PARENT_ID.toLowerCase()] });
    expect(chain.map((m) => m.id)).toEqual([CHILD_ID, PARENT_ID]);
  });

  it("orders the chain root first, which is what lets nesting resolve", () => {
    const grandchild = market({
      id: GRANDCHILD_ID,
      collateralToken: CHILD_YES,
      wrappedTokens: ["0x3333000000000000000000000000000000000001" as Address],
      parentMarket: { id: CHILD_ID, conditionId: "0x0", payoutReported: false, payoutNumerators: [] },
    });
    const priced = pricedMarketsRootFirst([grandchild, deadChild, resolvedParent]);
    expect(priced.map((m) => m.id)).toEqual([PARENT_ID, CHILD_ID, GRANDCHILD_ID]);
    expect(priced[0].parentMarketId).toBeUndefined();
    expect(priced[1].parentMarketId).toBe(PARENT_ID);
  });
});

describe("buildPortfolioPositionsCore", () => {
  beforeEach(() => {
    searchAllMarkets.mockReset();
    getCurrentOutcomePrices.mockReset();
    // The child's pool still quotes 0.8 against the parent outcome token long after that branch
    // died; the point of the fix is that nothing reads it as dollars.
    getCurrentOutcomePrices.mockResolvedValue({ [CHILD_YES]: 0.8, [PARENT_WON]: 1 });
  });

  const oneToken = 10n ** 18n;

  it("marks a position whose parent branch lost, even with the child still open", async () => {
    const positions = await buildPortfolioPositionsCore(GNOSIS, [CHILD_YES], [31662n * oneToken], [deadChild], false, [
      deadChild,
      resolvedParent,
    ]);

    // Kept, at zero. `get-portfolio` hides it; P/L needs it, or the loss vanishes from both ends of
    // the window instead of being booked.
    expect(positions).toHaveLength(1);
    expect(positions[0].isWorthless).toBe(true);
    expect(positions[0].tokenPrice).toBe(0);
    expect(positions[0].tokenValue).toBe(0);
    // Its price is known without asking a pool, so it never reaches the batch.
    expect(getCurrentOutcomePrices).not.toHaveBeenCalled();
  });

  it("keeps the same position on the branch the parent picked", async () => {
    const positions = await buildPortfolioPositionsCore(GNOSIS, [CHILD_YES], [31662n * oneToken], [liveChild], false, [
      liveChild,
      resolvedParent,
    ]);

    expect(positions).toHaveLength(1);
    expect(positions[0].tokenPrice).toBe(0.8);
    expect(positions[0].isWorthless).toBe(false);
  });

  it("labels the row from the parent chain, not from the wallet's own markets", async () => {
    // The parent is reachable only through the chain: `markets` here is what resolving the wallet's
    // holdings returns, and it does not contain it. Before, the row lost `parentMarketId` and the
    // UI dropped its "conditional on X" note along with it.
    searchAllMarkets.mockResolvedValue({ markets: [resolvedParent] });

    const [position] = await buildPortfolioPositionsCore(GNOSIS, [CHILD_YES], [oneToken], [liveChild], false);

    expect(position.parentMarketId).toBe(PARENT_ID);
    expect(position.parentMarketName).toBe(resolvedParent.marketName);
    expect(position.parentOutcome).toBe("Yes");
  });

  it("prices through the parent chain instead of the wallet's tokens alone", async () => {
    await buildPortfolioPositionsCore(GNOSIS, [CHILD_YES], [oneToken], [liveChild], false, [liveChild, resolvedParent]);

    const [pricedTokens, chainId, settled] = getCurrentOutcomePrices.mock.calls[0];
    expect(chainId).toBe(GNOSIS);
    // The parent's tokens are in the batch and come first, and the parent's settled payout is
    // seeded — the three things `mapOutcomePrices` needs to turn a relative quote into a price.
    expect(pricedTokens.map((t: { tokenId: string }) => t.tokenId)).toEqual([
      PARENT_WON,
      PARENT_LOST,
      CHILD_YES,
      CHILD_NO,
    ]);
    expect(pricedTokens[0].parentMarketId).toBeUndefined();
    expect(pricedTokens[2].parentMarketId).toBe(PARENT_ID);
    expect(settled).toEqual({ [PARENT_WON]: 1, [PARENT_LOST]: 0 });
  });

  it("marks a losing outcome of a market that has closed", async () => {
    // Same treatment as a dead branch, and for the same reason: the market resolved against this
    // outcome, so it is worth 0 for good — but the wallet did hold it, at a real price, before the
    // resolution landed. `redeemedPrice || tokenPrice` used to read that settled 0 as "unknown".
    const closedLoser = market({
      id: CHILD_ID,
      wrappedTokens: [CHILD_YES, CHILD_NO],
      questions: [settledQuestion],
      payoutReported: true,
      payoutNumerators: [0n, 1n],
    });

    const [position] = await buildPortfolioPositionsCore(GNOSIS, [CHILD_YES], [oneToken], [closedLoser], false);
    expect(position.isWorthless).toBe(true);
    expect(position.tokenValue).toBe(0);
  });

  it("keeps a winning outcome of a market that has closed", async () => {
    const closedWinner = market({
      id: CHILD_ID,
      wrappedTokens: [CHILD_YES, CHILD_NO],
      questions: [settledQuestion],
      payoutReported: true,
      payoutNumerators: [1n, 0n],
    });

    const [position] = await buildPortfolioPositionsCore(GNOSIS, [CHILD_YES], [oneToken], [closedWinner], false);
    expect(position.isWorthless).toBe(false);
  });
});

describe("worthless rows downstream", () => {
  beforeEach(() => {
    searchAllMarkets.mockReset();
    getCurrentOutcomePrices.mockReset();
    getCurrentOutcomePrices.mockResolvedValue({});
  });

  const worthless = { marketId: CHILD_ID, tokenId: CHILD_YES, tokenBalance: 1, isWorthless: true } as never;

  it("still prices them historically, which is the whole point of keeping them", async () => {
    // The current price is 0 by construction, but the reference price is not: before the parent
    // settled these tokens traded, and that value is what makes the loss show up in `valueStart`.
    const { tokens } = await outcomePriceInputsForPositions([worthless], GNOSIS, [deadChild, resolvedParent]);

    expect(searchAllMarkets).not.toHaveBeenCalled();
    expect(tokens.map((t) => t.tokenId)).toContain(CHILD_YES);
  });

  it("re-marks a cached row whose parent settled after the blob was written", async () => {
    // The cache hit is the only place that sees market data again, so the stale flag is re-derived
    // there rather than trusted.
    searchAllMarkets.mockResolvedValue({ markets: [deadChild] });
    const cached = { ...(worthless as object), isWorthless: false, chainId: GNOSIS, tokenPrice: 0.8 } as never;

    const [position] = await repricePortfolioPositions([cached]);

    expect(position.isWorthless).toBe(true);
    expect(position.tokenValue).toBe(0);
  });
});

describe("historical prices", () => {
  // Root first, exactly what `outcomePriceInputsForPositions` hands over.
  const tokens = [
    { tokenId: PARENT_WON, collateralToken: COLLATERAL },
    { tokenId: CHILD_YES, collateralToken: PARENT_WON, parentMarketId: PARENT_ID },
  ];
  // PARENT_WON sorts below CHILD_YES, so it is token0 and `token0_price` is parent-per-child.
  const childCandle = {
    token0_id: PARENT_WON,
    token1_id: CHILD_YES,
    token0_price: "0.8",
    token1_price: "1.25",
  };

  const supabaseWith = (rows: unknown[]) => ({ rpc: async () => ({ data: rows, error: null }) }) as never;

  it("carries a settled parent's payout down to the child's candle", async () => {
    const prices = await getHistoryTokensPricesForPortfolio(supabaseWith([childCandle]), tokens, GNOSIS, nowTs(), {
      [PARENT_WON]: 1,
    });
    expect(prices[CHILD_YES]).toBeCloseTo(0.8, 10);
  });

  it("reports a token with no candle as unknown rather than as zero", async () => {
    // Candles exist only for hours a pool traded, so a quiet pool has none — and the callers'
    // `?? position.tokenPrice` fallback is written for exactly that. A 0 defeats it and the
    // position reads as worthless at the reference, throwing the whole move into the delta.
    const prices = await getHistoryTokensPricesForPortfolio(supabaseWith([]), tokens, GNOSIS, nowTs(), {
      [PARENT_WON]: 1,
    });
    expect(prices[CHILD_YES]).toBeUndefined();
    expect(prices[PARENT_WON]).toBe(1);
  });

  it("propagates unknown down the chain when the parent leg is missing", async () => {
    const prices = await getHistoryTokensPricesForPortfolio(supabaseWith([childCandle]), tokens, GNOSIS, nowTs());
    expect(prices[PARENT_WON]).toBeUndefined();
    expect(prices[CHILD_YES]).toBeUndefined();
  });
});
