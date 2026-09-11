import {
  AmmTrade,
  type CompleteSetQuoteResult,
  type Market,
  REALITY_TEMPLATE_MULTIPLE_SELECT,
  REALITY_TEMPLATE_SINGLE_SELECT,
  REALITY_TEMPLATE_UINT,
  type Token,
  TradeType,
  buildMintToCoverQuote,
  getActiveCreditsTokenAddress,
  isMintToCoverEligible,
} from "@seer-pm/sdk";
import type { Address } from "viem";
import { zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

const account = "0x0000000000000000000000000000000000000009" as Address;
const COLLATERAL = "0x0000000000000000000000000000000000000001" as Address;
const DOWN = "0x0000000000000000000000000000000000000002" as Address;
const UP = "0x0000000000000000000000000000000000000003" as Address;
const INVALID = "0x0000000000000000000000000000000000000004" as Address;

const createMinimalMarket = (overrides: Partial<Market> = {}): Market =>
  ({
    id: zeroAddress,
    type: "Generic",
    marketName: "",
    outcomes: ["DOWN", "UP", "Invalid"],
    collateralToken: COLLATERAL,
    collateralToken1: zeroAddress,
    collateralToken2: zeroAddress,
    wrappedTokens: [DOWN, UP, INVALID],
    parentMarket: { id: zeroAddress, conditionId: "0x0", payoutReported: false, payoutNumerators: [] },
    parentOutcome: 0n,
    parentCollectionId: "0x0",
    conditionId: "0x0",
    questionId: "0x0",
    templateId: BigInt(REALITY_TEMPLATE_UINT),
    questions: [],
    openingTs: 0,
    finalizeTs: 0,
    encodedQuestions: [],
    lowerBound: 0n,
    upperBound: 0n,
    payoutReported: false,
    payoutNumerators: [],
    chainId: 100,
    outcomesSupply: 0n,
    liquidityUSD: 0,
    openInterestUSD: 0,
    maxLiquidity: 0,
    incentive: 0,
    hasLiquidity: false,
    categories: ["misc"],
    poolBalance: [],
    odds: [50, 50, 0],
    url: "",
    verification: undefined,
    ...overrides,
  }) as Market;

const outcomeAddress = (index: number) => `0x${(0x20 + index).toString(16).padStart(40, "0")}` as Address;

/** `outcomeCount` tradeable outcomes plus Invalid, so `outcomeCount + 1` wrapped tokens. */
const createCategoricalMarket = (outcomeCount: number, overrides: Partial<Market> = {}) =>
  createMinimalMarket({
    templateId: BigInt(REALITY_TEMPLATE_SINGLE_SELECT),
    outcomes: [...Array.from({ length: outcomeCount }, (_, index) => `OUTCOME_${index}`), "Invalid"],
    wrappedTokens: [...Array.from({ length: outcomeCount }, (_, index) => outcomeAddress(index)), INVALID],
    odds: [...Array.from({ length: outcomeCount }, () => 100 / outcomeCount), 0],
    ...overrides,
  });

const collateral: Token = { address: COLLATERAL, symbol: "sDAI", decimals: 18, chainId: 100 };

function createSellTrade(amountIn: bigint, tokenIn: Address = UP) {
  const trade = Object.create(AmmTrade.prototype) as AmmTrade;
  Object.assign(trade, {
    approveAddress: "0x00000000000000000000000000000000000000ab",
    chainId: 100,
    tokenIn: { address: tokenIn, symbol: "UP", decimals: 18, chainId: 100 },
    tokenOut: { address: COLLATERAL, symbol: "sDAI", decimals: 18, chainId: 100 },
    amountIn,
    amountOut: amountIn / 2n,
    maximumAmountIn: () => amountIn,
  });
  return trade;
}

function createDirectQuote(
  amountIn: bigint,
  overrides: Partial<CompleteSetQuoteResult> = {},
  tokenIn: Address = UP,
): CompleteSetQuoteResult {
  return {
    value: amountIn / 2n,
    decimals: 18,
    buyToken: COLLATERAL,
    sellToken: UP,
    sellAmount: "10",
    swapType: "sell",
    trade: createSellTrade(amountIn, tokenIn),
    route: "direct",
    netCollateral: amountIn / 2n,
    ...overrides,
  };
}

const baseParams = {
  market: createMinimalMarket(),
  outcomeIndex: 1,
  selectedCollateral: collateral,
  swapType: "sell" as const,
  tradeType: TradeType.EXACT_INPUT,
  account,
};

describe("isMintToCoverEligible", () => {
  it("accepts a binary generic market being sold with market collateral", () => {
    expect(isMintToCoverEligible(baseParams)).toBe(true);
  });

  it("rejects the buy direction", () => {
    expect(isMintToCoverEligible({ ...baseParams, swapType: "buy" })).toBe(false);
  });

  it("rejects exact output, where the amount is rewritten on every re-quote", () => {
    expect(isMintToCoverEligible({ ...baseParams, tradeType: TradeType.EXACT_OUTPUT })).toBe(false);
  });

  it("rejects a disconnected account", () => {
    expect(isMintToCoverEligible({ ...baseParams, account: undefined })).toBe(false);
  });

  it("rejects futarchy markets", () => {
    expect(isMintToCoverEligible({ ...baseParams, market: createMinimalMarket({ type: "Futarchy" }) })).toBe(false);
  });

  it("accepts the invalid outcome, which the split mints like any other", () => {
    expect(isMintToCoverEligible({ ...baseParams, outcomeIndex: 2 })).toBe(true);
  });

  it("rejects an outcome index past the end of the set", () => {
    expect(isMintToCoverEligible({ ...baseParams, outcomeIndex: 3 })).toBe(false);
    expect(isMintToCoverEligible({ ...baseParams, outcomeIndex: -1 })).toBe(false);
  });

  it("rejects a market too small to hold a full set", () => {
    const market = createMinimalMarket({ outcomes: ["DOWN", "UP"], wrappedTokens: [DOWN, UP] });
    expect(isMintToCoverEligible({ ...baseParams, market, outcomeIndex: 0 })).toBe(false);
  });

  it("rejects trading credits collateral", () => {
    const credits = getActiveCreditsTokenAddress(100) as Address;
    expect(isMintToCoverEligible({ ...baseParams, selectedCollateral: { ...collateral, address: credits } })).toBe(
      false,
    );
  });

  it("rejects a collateral that is not the market collateral", () => {
    expect(isMintToCoverEligible({ ...baseParams, selectedCollateral: { ...collateral, address: DOWN } })).toBe(false);
  });

  it("rejects conditional markets, whose split takes the parent collateral", () => {
    const market = createMinimalMarket({
      parentMarket: { id: DOWN, conditionId: "0x0", payoutReported: false, payoutNumerators: [] },
    });
    expect(isMintToCoverEligible({ ...baseParams, market })).toBe(false);
  });

  it("rejects a collateral that is not 18 decimals", () => {
    expect(isMintToCoverEligible({ ...baseParams, selectedCollateral: { ...collateral, decimals: 6 } })).toBe(false);
  });

  it("accepts categorical markets with three wrapped tokens", () => {
    const market = createMinimalMarket({ templateId: BigInt(REALITY_TEMPLATE_SINGLE_SELECT) });
    expect(isMintToCoverEligible({ ...baseParams, market })).toBe(true);
  });

  it("accepts an outcome the binary complete-set routes cannot reach", () => {
    const market = createCategoricalMarket(4);
    expect(isMintToCoverEligible({ ...baseParams, market, outcomeIndex: 2 })).toBe(true);
    expect(isMintToCoverEligible({ ...baseParams, market, outcomeIndex: 3 })).toBe(true);
    // Invalid, index 4, is still a real wrapped token; index 5 is not.
    expect(isMintToCoverEligible({ ...baseParams, market, outcomeIndex: 4 })).toBe(true);
    expect(isMintToCoverEligible({ ...baseParams, market, outcomeIndex: 5 })).toBe(false);
  });

  it("accepts multi-categorical and multi-scalar markets, whose complete set is also worth 1", () => {
    const multiCategorical = createCategoricalMarket(4, { templateId: BigInt(REALITY_TEMPLATE_MULTIPLE_SELECT) });
    expect(isMintToCoverEligible({ ...baseParams, market: multiCategorical, outcomeIndex: 2 })).toBe(true);

    const multiScalar = createCategoricalMarket(3, {
      templateId: BigInt(REALITY_TEMPLATE_UINT),
      questions: [{}, {}, {}] as unknown as Market["questions"],
    });
    expect(isMintToCoverEligible({ ...baseParams, market: multiScalar, outcomeIndex: 1 })).toBe(true);
  });
});

describe("buildMintToCoverQuote", () => {
  const sellAmount = 10n * 10n ** 18n;

  const build = (outcomeBalance: bigint, collateralBalance: bigint, directQuote = createDirectQuote(sellAmount)) =>
    buildMintToCoverQuote({ ...baseParams, outcomeBalance, collateralBalance, directQuote });

  it("mints the whole sell amount when the user holds none", () => {
    const status = build(0n, sellAmount);

    expect(status.kind).toBe("ready");
    if (status.kind !== "ready") return;
    expect(status.quote.route).toBe("mintToCover");
    expect(status.quote.completeSetLeg?.splitAmount).toBe(sellAmount);
    expect(status.quote.completeSetLeg?.swapInputAmount).toBe(sellAmount);
  });

  it("mints only the shortfall when the user already holds some", () => {
    const held = 4n * 10n ** 18n;
    const status = build(held, sellAmount);

    expect(status.kind).toBe("ready");
    if (status.kind !== "ready") return;
    const leg = status.quote.completeSetLeg;
    expect(leg?.splitAmount).toBe(sellAmount - held);
    // The sell leg still moves everything: minted plus already held.
    expect(leg?.swapInputAmount).toBe(sellAmount);
    expect(leg?.existingBalance).toBe(held);
  });

  it("sells the target outcome and keeps the rest of the set", () => {
    const status = build(0n, sellAmount);

    expect(status.kind).toBe("ready");
    if (status.kind !== "ready") return;
    const leg = status.quote.completeSetLeg;
    expect(leg?.swapInputToken?.address).toBe(UP);
    expect(leg?.leftoverTokens?.map((leftover) => leftover.token.address)).toEqual([DOWN, INVALID]);
    expect(leg?.leftoverTokens?.every((leftover) => leftover.amount === sellAmount)).toBe(true);
  });

  it("fronts the split as netCollateral and claims no savings", () => {
    const status = build(0n, sellAmount);

    expect(status.kind).toBe("ready");
    if (status.kind !== "ready") return;
    expect(status.quote.netCollateral).toBe(sellAmount);
    expect(status.quote.savingsPercent).toBeUndefined();
  });

  it("reports the shortfall when the split cannot be funded", () => {
    const status = build(0n, sellAmount - 1n);

    expect(status.kind).toBe("insufficientCollateral");
    if (status.kind !== "insufficientCollateral") return;
    expect(status.splitAmount).toBe(sellAmount);
  });

  it("stays off when the user already holds enough", () => {
    expect(build(sellAmount, sellAmount).kind).toBe("off");
    expect(build(sellAmount + 1n, sellAmount).kind).toBe("off");
  });

  it("stays off without a direct quote", () => {
    expect(
      buildMintToCoverQuote({
        ...baseParams,
        outcomeBalance: 0n,
        collateralBalance: sellAmount,
        directQuote: undefined,
      }).kind,
    ).toBe("off");
  });

  it("keeps every other outcome of a six-outcome market, Invalid included", () => {
    const market = createCategoricalMarket(6);
    const outcomeIndex = 3;
    const status = buildMintToCoverQuote({
      ...baseParams,
      market,
      outcomeIndex,
      outcomeBalance: 0n,
      collateralBalance: sellAmount,
      directQuote: createDirectQuote(sellAmount, {}, market.wrappedTokens[outcomeIndex]),
    });

    expect(status.kind).toBe("ready");
    if (status.kind !== "ready") return;
    const leg = status.quote.completeSetLeg;
    expect(leg?.targetOutcomeIndex).toBe(outcomeIndex);
    expect(leg?.swapInputToken?.address).toBe(market.wrappedTokens[outcomeIndex]);
    // Six tradeable outcomes plus Invalid, minus the one being sold.
    expect(leg?.leftoverTokens?.map((leftover) => leftover.token.address)).toEqual(
      market.wrappedTokens.filter((_, index) => index !== outcomeIndex),
    );
    expect(leg?.leftoverTokens?.every((leftover) => leftover.amount === sellAmount)).toBe(true);
    // The binary routes' fields have no meaning here and must not be invented.
    expect(leg?.oppositeOutcomeToken).toBeUndefined();
    expect(leg?.oppositeOutcomeIndex).toBeUndefined();
  });

  it("stays off when the direct quote sells a different outcome", () => {
    const market = createCategoricalMarket(4);
    const status = buildMintToCoverQuote({
      ...baseParams,
      market,
      outcomeIndex: 2,
      outcomeBalance: 0n,
      collateralBalance: sellAmount,
      // A quote left over from outcome 1: splitting on it would approve and sell the wrong token.
      directQuote: createDirectQuote(sellAmount, {}, market.wrappedTokens[1]),
    });

    expect(status.kind).toBe("off");
  });

  it("stays off when the winning route is not a plain swap", () => {
    const buyMerge = createDirectQuote(sellAmount, { route: "buyMerge" });
    expect(build(0n, sellAmount, buyMerge).kind).toBe("off");
  });
});
