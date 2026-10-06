import {
  AmmTrade,
  type CompleteSetQuoteResult,
  MAX_SPLIT_OUTCOMES,
  type Market,
  REALITY_TEMPLATE_MULTIPLE_SELECT,
  REALITY_TEMPLATE_SINGLE_SELECT,
  REALITY_TEMPLATE_UINT,
  type Token,
  TradeType,
  buildMintToCoverQuote,
  getActiveCreditsTokenAddress,
  getActivePrimaryCollateral,
  getSplitSteps,
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
const PARENT_ID = "0x0000000000000000000000000000000000000010" as Address;
const PARENT_YES = "0x0000000000000000000000000000000000000011" as Address;
const PARENT_NO = "0x0000000000000000000000000000000000000012" as Address;
const PARENT_INVALID = "0x0000000000000000000000000000000000000013" as Address;

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
    volumeUSD: 0,
    volumeNotionalUSD: 0,
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

const baseCollateral = getActivePrimaryCollateral(100);
const parentYesToken: Token = { address: PARENT_YES, symbol: "YES", decimals: 18, chainId: 100 };

/** A binary market whose outcome YES is the collateral of `createChildMarket()`. */
const createParentMarket = () =>
  createMinimalMarket({
    id: PARENT_ID,
    outcomes: ["YES", "NO", "Invalid"],
    wrappedTokens: [PARENT_YES, PARENT_NO, PARENT_INVALID],
    collateralToken: baseCollateral.address,
  });

/** A child of `createParentMarket()`, conditional on YES: its collateral is the YES token. */
const createChildMarket = () =>
  createMinimalMarket({
    collateralToken: PARENT_YES,
    parentMarket: { id: PARENT_ID, conditionId: "0x0", payoutReported: false, payoutNumerators: [] },
    parentOutcome: 0n,
  });

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

  it("accepts a child market sold against the parent outcome token", () => {
    expect(
      isMintToCoverEligible({ ...baseParams, market: createChildMarket(), selectedCollateral: parentYesToken }),
    ).toBe(true);
  });

  it("accepts a child market sold against the base collateral only once the parent market is loaded", () => {
    const params = { ...baseParams, market: createChildMarket(), selectedCollateral: baseCollateral };
    expect(isMintToCoverEligible(params)).toBe(false);
    expect(isMintToCoverEligible({ ...params, parentMarket: createParentMarket() })).toBe(true);
    // A stale parent from another market cannot describe the first split.
    expect(isMintToCoverEligible({ ...params, parentMarket: createMinimalMarket({ id: DOWN }) })).toBe(false);
  });

  it("rejects a set too large to split in one transaction, on either level", () => {
    // 79 outcomes plus Invalid is the live case and fits; a split is one transaction on its own, so
    // two such markets are fine together. A set past the cap cannot be minted at all.
    const bigParent = createCategoricalMarket(79, { id: PARENT_ID, collateralToken: baseCollateral.address });
    const bigChild = createCategoricalMarket(79, {
      collateralToken: bigParent.wrappedTokens[0],
      parentMarket: { id: PARENT_ID, conditionId: "0x0", payoutReported: false, payoutNumerators: [] },
      parentOutcome: 0n,
    });
    expect(bigChild.wrappedTokens.length).toBeLessThanOrEqual(MAX_SPLIT_OUTCOMES);
    expect(
      isMintToCoverEligible({
        ...baseParams,
        market: bigChild,
        parentMarket: bigParent,
        selectedCollateral: baseCollateral,
      }),
    ).toBe(true);

    const hugeParent = createCategoricalMarket(MAX_SPLIT_OUTCOMES, {
      id: PARENT_ID,
      collateralToken: baseCollateral.address,
    });
    const childOfHuge = createCategoricalMarket(3, {
      collateralToken: hugeParent.wrappedTokens[0],
      parentMarket: { id: PARENT_ID, conditionId: "0x0", payoutReported: false, payoutNumerators: [] },
      parentOutcome: 0n,
    });
    const hugeParentToken: Token = {
      address: hugeParent.wrappedTokens[0],
      symbol: "OUTCOME_0",
      decimals: 18,
      chainId: 100,
    };
    // Paid in the parent token only the child is split, so the parent's size does not matter.
    expect(isMintToCoverEligible({ ...baseParams, market: childOfHuge, selectedCollateral: hugeParentToken })).toBe(
      true,
    );
    expect(
      isMintToCoverEligible({
        ...baseParams,
        market: childOfHuge,
        parentMarket: hugeParent,
        selectedCollateral: baseCollateral,
      }),
    ).toBe(false);
    expect(isMintToCoverEligible({ ...baseParams, market: createCategoricalMarket(MAX_SPLIT_OUTCOMES) })).toBe(false);
  });

  it("rejects a child market sold against a collateral that is neither", () => {
    expect(isMintToCoverEligible({ ...baseParams, market: createChildMarket(), selectedCollateral: collateral })).toBe(
      false,
    );
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

  it("splits a root market from its own collateral in a single step", () => {
    const status = build(0n, sellAmount);

    expect(status.kind).toBe("ready");
    if (status.kind !== "ready") return;
    expect(getSplitSteps(status.quote.completeSetLeg!)).toEqual([
      {
        market: { id: zeroAddress, type: "Generic", chainId: 100 },
        spendToken: COLLATERAL,
        routerCollateral: COLLATERAL,
        amount: sellAmount,
        outcomeCount: 3,
      },
    ]);
  });

  it("splits a child market from the parent outcome token, telling the router the base collateral", () => {
    const market = createChildMarket();
    const status = buildMintToCoverQuote({
      ...baseParams,
      market,
      selectedCollateral: parentYesToken,
      outcomeBalance: 0n,
      collateralBalance: sellAmount,
      directQuote: createDirectQuote(sellAmount),
    });

    expect(status.kind).toBe("ready");
    if (status.kind !== "ready") return;
    const leg = status.quote.completeSetLeg!;
    expect(leg.collateralToken).toBe(PARENT_YES);
    expect(leg.splitSteps).toEqual([
      {
        market: { id: market.id, type: "Generic", chainId: 100 },
        spendToken: PARENT_YES,
        routerCollateral: baseCollateral.address,
        amount: sellAmount,
        outcomeCount: 3,
      },
    ]);
    expect(leg.leftoverTokens?.map((leftover) => leftover.token.address)).toEqual([DOWN, INVALID]);
  });

  it("splits the parent market first when the child is sold against the base collateral", () => {
    const market = createChildMarket();
    const parentMarket = createParentMarket();
    const params = {
      ...baseParams,
      market,
      selectedCollateral: baseCollateral,
      outcomeBalance: 4n * 10n ** 18n,
      collateralBalance: sellAmount,
      directQuote: createDirectQuote(sellAmount),
    };
    expect(buildMintToCoverQuote(params).kind).toBe("off");

    const status = buildMintToCoverQuote({ ...params, parentMarket });
    expect(status.kind).toBe("ready");
    if (status.kind !== "ready") return;
    const leg = status.quote.completeSetLeg!;
    const splitAmount = 6n * 10n ** 18n;
    expect(leg.splitAmount).toBe(splitAmount);
    expect(leg.collateralToken).toBe(baseCollateral.address);
    expect(leg.splitSteps).toEqual([
      {
        market: { id: PARENT_ID, type: "Generic", chainId: 100 },
        spendToken: baseCollateral.address,
        routerCollateral: baseCollateral.address,
        amount: splitAmount,
        outcomeCount: 3,
      },
      {
        market: { id: market.id, type: "Generic", chainId: 100 },
        spendToken: PARENT_YES,
        routerCollateral: baseCollateral.address,
        amount: splitAmount,
        outcomeCount: 3,
      },
    ]);
    // The parent outcome the child hangs off is consumed by the second split; everything else stays.
    expect(leg.leftoverTokens?.map((leftover) => leftover.token.address)).toEqual([
      PARENT_NO,
      PARENT_INVALID,
      DOWN,
      INVALID,
    ]);
    expect(leg.leftoverTokens?.every((leftover) => leftover.amount === splitAmount)).toBe(true);
  });

  it("reports an oversized split instead of a quote, naming the level", () => {
    const hugeParent = createCategoricalMarket(MAX_SPLIT_OUTCOMES, {
      id: PARENT_ID,
      collateralToken: baseCollateral.address,
    });
    const child = createCategoricalMarket(3, {
      collateralToken: hugeParent.wrappedTokens[0],
      parentMarket: { id: PARENT_ID, conditionId: "0x0", payoutReported: false, payoutNumerators: [] },
      parentOutcome: 0n,
    });
    const status = buildMintToCoverQuote({
      ...baseParams,
      market: child,
      parentMarket: hugeParent,
      selectedCollateral: baseCollateral,
      outcomeIndex: 1,
      outcomeBalance: 0n,
      collateralBalance: sellAmount,
      directQuote: createDirectQuote(sellAmount, {}, child.wrappedTokens[1]),
    });
    expect(status).toEqual({
      kind: "splitTooLarge",
      outcomeCount: MAX_SPLIT_OUTCOMES + 1,
      maxOutcomeCount: MAX_SPLIT_OUTCOMES,
      isParent: true,
    });

    const huge = createCategoricalMarket(MAX_SPLIT_OUTCOMES);
    expect(
      buildMintToCoverQuote({
        ...baseParams,
        market: huge,
        outcomeBalance: 0n,
        collateralBalance: sellAmount,
        directQuote: createDirectQuote(sellAmount, {}, huge.wrappedTokens[1]),
      }),
    ).toEqual({
      kind: "splitTooLarge",
      outcomeCount: MAX_SPLIT_OUTCOMES + 1,
      maxOutcomeCount: MAX_SPLIT_OUTCOMES,
      isParent: false,
    });
  });

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
