import {
  type CompleteSetQuoteResult,
  MIN_COMPLETE_SET_SAVINGS_PERCENT,
  type QuoteTradeResult,
  compareCompleteSetRoutes,
  getCompleteSetRoutingDisabledReasons,
  getOppositeOutcomeIndex,
  getSplitCollateralDisabledReasons,
  isCompleteSetMarket,
  isCompleteSetRoutingEnabled,
  isMintToCoverRoutingEnabled,
  isSplitCollateralEnabled,
} from "@seer-pm/sdk";
import { REALITY_TEMPLATE_SINGLE_SELECT, REALITY_TEMPLATE_UINT } from "@seer-pm/sdk";
import type { Market } from "@seer-pm/sdk";
import { TradeType } from "@seer-pm/sdk";
import { getActiveCreditsTokenAddress } from "@seer-pm/sdk";
import { zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

const createMinimalMarket = (overrides: Partial<Market>): Market => ({
  id: zeroAddress,
  type: "Generic",
  marketName: "",
  outcomes: ["DOWN", "UP", "Invalid"],
  collateralToken: "0x0000000000000000000000000000000000000001",
  collateralToken1: zeroAddress,
  collateralToken2: zeroAddress,
  wrappedTokens: [
    zeroAddress,
    "0x0000000000000000000000000000000000000002",
    "0x0000000000000000000000000000000000000003",
  ],
  parentMarket: {
    id: zeroAddress,
    conditionId: "0x0",
    payoutReported: false,
    payoutNumerators: [],
  },
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
});

const directBuyQuote = (tokensOut: bigint, collateralIn: string): QuoteTradeResult => ({
  value: tokensOut,
  decimals: 18,
  buyToken: zeroAddress,
  sellToken: "0x0000000000000000000000000000000000000001",
  sellAmount: collateralIn,
  swapType: "buy",
  trade: {} as QuoteTradeResult["trade"],
});

const mintSellQuote = (tokensOut: bigint, netCollateralIn: bigint): CompleteSetQuoteResult => ({
  ...directBuyQuote(tokensOut, "999"),
  route: "mintSell",
  netCollateral: netCollateralIn,
  sellAmount: (Number(netCollateralIn) / 1e18).toString(),
});

describe("isCompleteSetMarket", () => {
  it("returns true for scalar markets with three wrapped tokens", () => {
    const market = createMinimalMarket({ templateId: BigInt(REALITY_TEMPLATE_UINT) });
    expect(isCompleteSetMarket(market)).toBe(true);
  });

  it("returns true for categorical markets with three wrapped tokens", () => {
    const market = createMinimalMarket({ templateId: BigInt(REALITY_TEMPLATE_SINGLE_SELECT) });
    expect(isCompleteSetMarket(market)).toBe(true);
  });

  it("returns false for futarchy markets", () => {
    const market = createMinimalMarket({ type: "Futarchy" });
    expect(isCompleteSetMarket(market)).toBe(false);
  });

  it("returns false when there are not exactly three wrapped tokens", () => {
    const market = createMinimalMarket({ wrappedTokens: [zeroAddress, zeroAddress] });
    expect(isCompleteSetMarket(market)).toBe(false);
  });
});

describe("isCompleteSetRoutingEnabled", () => {
  it("returns true for tradeable outcomes with matching collateral", () => {
    const market = createMinimalMarket({});
    expect(isCompleteSetRoutingEnabled(market, 0, market.collateralToken as `0x${string}`)).toBe(true);
  });

  it("returns false for invalid outcome index", () => {
    const market = createMinimalMarket({});
    expect(isCompleteSetRoutingEnabled(market, 2, market.collateralToken as `0x${string}`)).toBe(false);
  });

  it("returns false for conditional markets, whose split takes the base collateral", () => {
    const market = createMinimalMarket({
      parentMarket: {
        id: "0x0000000000000000000000000000000000000005",
        conditionId: "0x0",
        payoutReported: false,
        payoutNumerators: [],
      },
    });

    expect(isCompleteSetRoutingEnabled(market, 0, market.collateralToken as `0x${string}`)).toBe(false);
    expect(getCompleteSetRoutingDisabledReasons(market, 0, market.collateralToken as `0x${string}`)).toContain(
      "conditional market: split/merge needs the base collateral, not the parent outcome token",
    );
  });

  it("returns false for trading credits collateral", () => {
    const market = createMinimalMarket({ chainId: 100 });
    const credits = getActiveCreditsTokenAddress(100)!;
    expect(isCompleteSetRoutingEnabled(market, 0, credits)).toBe(false);
  });
});

const COLLATERAL = "0x0000000000000000000000000000000000000001" as const;

/** `outcomeCount` tradeable outcomes plus Invalid. */
const createCategoricalMarket = (outcomeCount: number, overrides: Partial<Market> = {}) =>
  createMinimalMarket({
    templateId: BigInt(REALITY_TEMPLATE_SINGLE_SELECT),
    outcomes: [...Array.from({ length: outcomeCount }, (_, index) => `OUTCOME_${index}`), "Invalid"],
    wrappedTokens: [
      ...Array.from(
        { length: outcomeCount },
        (_, index) => `0x${(0x20 + index).toString(16).padStart(40, "0")}` as `0x${string}`,
      ),
      "0x00000000000000000000000000000000000000ff",
    ],
    ...overrides,
  });

describe("isSplitCollateralEnabled", () => {
  it("accepts the binary market the complete-set routes use", () => {
    expect(isSplitCollateralEnabled(createMinimalMarket({}), COLLATERAL)).toBe(true);
  });

  it("accepts markets with more outcomes than the binary routes can handle", () => {
    expect(isSplitCollateralEnabled(createCategoricalMarket(4), COLLATERAL)).toBe(true);
    expect(isSplitCollateralEnabled(createCategoricalMarket(9), COLLATERAL)).toBe(true);
  });

  it("rejects futarchy markets and sets too small to split", () => {
    expect(isSplitCollateralEnabled(createMinimalMarket({ type: "Futarchy" }), COLLATERAL)).toBe(false);
    expect(isSplitCollateralEnabled(createMinimalMarket({ wrappedTokens: [zeroAddress] }), COLLATERAL)).toBe(false);
  });

  it("rejects conditional markets, whose split takes the base collateral", () => {
    const market = createMinimalMarket({
      parentMarket: {
        id: "0x0000000000000000000000000000000000000005",
        conditionId: "0x0",
        payoutReported: false,
        payoutNumerators: [],
      },
    });

    expect(isSplitCollateralEnabled(market, COLLATERAL)).toBe(false);
    expect(getSplitCollateralDisabledReasons(market, COLLATERAL)).toContain(
      "conditional market: split/merge needs the base collateral, not the parent outcome token",
    );
  });

  it("rejects trading credits collateral", () => {
    expect(isSplitCollateralEnabled(createMinimalMarket({ chainId: 100 }), getActiveCreditsTokenAddress(100)!)).toBe(
      false,
    );
  });
});

describe("isMintToCoverRoutingEnabled", () => {
  it("accepts any index that names a wrapped token, Invalid included", () => {
    const market = createCategoricalMarket(4);
    for (const index of [0, 1, 2, 3, 4]) {
      expect(isMintToCoverRoutingEnabled(market, index, COLLATERAL)).toBe(true);
    }
  });

  it("rejects indexes outside the set", () => {
    const market = createCategoricalMarket(4);
    expect(isMintToCoverRoutingEnabled(market, 5, COLLATERAL)).toBe(false);
    expect(isMintToCoverRoutingEnabled(market, -1, COLLATERAL)).toBe(false);
    expect(isMintToCoverRoutingEnabled(market, 1.5, COLLATERAL)).toBe(false);
  });

  it("does not widen the binary routes on the same market", () => {
    const market = createCategoricalMarket(4);
    expect(isCompleteSetRoutingEnabled(market, 0, COLLATERAL)).toBe(false);
    expect(isCompleteSetRoutingEnabled(market, 2, COLLATERAL)).toBe(false);
  });
});

describe("getOppositeOutcomeIndex", () => {
  it("flips between 0 and 1", () => {
    expect(getOppositeOutcomeIndex(0)).toBe(1);
    expect(getOppositeOutcomeIndex(1)).toBe(0);
  });
});

describe("compareCompleteSetRoutes", () => {
  it("prefers mint+sell when it yields more tokens for the same input", () => {
    const direct = directBuyQuote(20n * 10n ** 18n, "25");
    const alternative = mintSellQuote(25n * 10n ** 18n, 18n * 10n ** 18n);

    const result = compareCompleteSetRoutes(direct, alternative, "buy", TradeType.EXACT_INPUT);
    expect(result?.route).toBe("mintSell");
  });

  it("prefers direct when it is cheaper for the same token output", () => {
    const direct: QuoteTradeResult = {
      ...directBuyQuote(100n * 10n ** 18n, "100"),
      value: 18n * 10n ** 18n,
    };
    const alternative = mintSellQuote(100n * 10n ** 18n, 20n * 10n ** 18n);

    const result = compareCompleteSetRoutes(direct, alternative, "buy", TradeType.EXACT_OUTPUT);
    expect(result?.route).toBe("direct");
  });

  it("prefers direct on equal outcomes", () => {
    const direct = directBuyQuote(100n * 10n ** 18n, "20");
    const alternative = mintSellQuote(100n * 10n ** 18n, 20n * 10n ** 18n);

    const result = compareCompleteSetRoutes(direct, alternative, "buy", TradeType.EXACT_INPUT);
    expect(result?.route).toBe("direct");
  });

  it("includes savingsPercent when mint+sell wins", () => {
    const direct = directBuyQuote(20n * 10n ** 18n, "25");
    const alternative = mintSellQuote(25n * 10n ** 18n, 18n * 10n ** 18n);

    const result = compareCompleteSetRoutes(direct, alternative, "buy", TradeType.EXACT_INPUT);
    expect(result?.route).toBe("mintSell");
    expect(result?.savingsPercent).toBe(25);
  });

  it("prefers direct when composite savings are below the minimum threshold", () => {
    const directCollateralOut = 1_000_000n * 10n ** 18n;
    const direct: QuoteTradeResult = {
      value: directCollateralOut,
      decimals: 18,
      buyToken: "0x0000000000000000000000000000000000000001",
      sellToken: zeroAddress,
      sellAmount: "100",
      swapType: "sell",
      trade: {} as QuoteTradeResult["trade"],
    };
    const alternative: CompleteSetQuoteResult = {
      ...direct,
      route: "buyMerge",
      netCollateral: 500n * 10n ** 18n,
      value: directCollateralOut + directCollateralOut / 10_000n,
    };

    const result = compareCompleteSetRoutes(direct, alternative, "sell", TradeType.EXACT_INPUT);
    expect(result?.route).toBe("direct");
    expect(MIN_COMPLETE_SET_SAVINGS_PERCENT).toBe(0.5);
  });
});
