import { Market, Question } from "@/hooks/useMarket";
import { zeroAddress } from "viem";
import { describe, expect, it } from "vitest";
import { MarketTypes, getMarketType, getQuestionParts, isMarketReliable } from "./market";
import {
  REALITY_TEMPLATE_MULTIPLE_SELECT,
  REALITY_TEMPLATE_SINGLE_SELECT,
  REALITY_TEMPLATE_UINT,
  encodeQuestionText,
} from "./reality";
import { INVALID_RESULT_OUTCOME_TEXT } from "./utils";

const createMinimalMarket = (overrides: Partial<Market>): Market => {
  return {
    id: zeroAddress,
    type: "Generic",
    marketName: "",
    outcomes: [],
    collateralToken: zeroAddress,
    collateralToken1: zeroAddress,
    collateralToken2: zeroAddress,
    wrappedTokens: [],
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
    templateId: 0n,
    questions: [],
    openingTs: 0,
    finalizeTs: 0,
    encodedQuestions: [],
    lowerBound: 0n,
    upperBound: 0n,
    payoutReported: false,
    payoutNumerators: [],
    chainId: 1,
    outcomesSupply: 0n,
    liquidityUSD: 0,
    incentive: 0,
    hasLiquidity: false,
    categories: ["misc"],
    poolBalance: [],
    odds: [],
    url: "",
    ...overrides,
  };
};

const createDefaultQuestion = (overrides: Partial<Question> = {}): Question => {
  return {
    id: "0x000",
    arbitrator: "0x0000000000000000000000000000000000000000",
    opening_ts: Math.floor(Date.now() / 1000),
    timeout: 129600,
    finalize_ts: 0,
    is_pending_arbitration: false,
    best_answer: "0x0000000000000000000000000000000000000000000000000000000000000000",
    bond: 0n,
    min_bond: 100000000000000000n,
    ...overrides,
  };
};

describe("getQuestionParts", () => {
  it("should return empty strings for non-multi-scalar market types", () => {
    const marketName = "How many electoral votes will the [party] win in the 2024 U.S. Presidential Election?";

    expect(getQuestionParts(marketName, MarketTypes.CATEGORICAL)).toEqual({
      questionStart: "",
      questionEnd: "",
      outcomeType: "",
    });
    expect(getQuestionParts(marketName, MarketTypes.SCALAR)).toEqual({
      questionStart: "",
      questionEnd: "",
      outcomeType: "",
    });
    expect(getQuestionParts(marketName, MarketTypes.MULTI_CATEGORICAL)).toEqual({
      questionStart: "",
      questionEnd: "",
      outcomeType: "",
    });
  });

  it("should return correct parts for a valid multi-scalar market name", () => {
    const marketName = "How many electoral votes will the [party] win in the 2024 U.S. Presidential Election?";
    const result = getQuestionParts(marketName, MarketTypes.MULTI_SCALAR);

    expect(result).toEqual({
      questionStart: "How many electoral votes will the ",
      questionEnd: " win in the 2024 U.S. Presidential Election?",
      outcomeType: "party",
    });
  });

  it("should return correct parts for a valid multi-scalar market name with unit", () => {
    const marketName = "How many electoral votes will the [party] win in the 2024 U.S. Presidential Election? [votes]";
    const result = getQuestionParts(marketName, MarketTypes.MULTI_SCALAR);

    expect(result).toEqual({
      questionStart: "How many electoral votes will the ",
      questionEnd: " win in the 2024 U.S. Presidential Election? [votes]",
      outcomeType: "party",
    });
  });

  it("should return undefined when multi-scalar market name doesn't have the correct format", () => {
    const marketName = "How many electoral votes will the party win in the 2024 U.S. Presidential Election?";
    const result = getQuestionParts(marketName, MarketTypes.MULTI_SCALAR);
    expect(result).toBeUndefined();
  });

  it("should return undefined when multi-scalar market name has multiple brackets", () => {
    const marketName = "How many electoral votes will the [party] win in the [2024] U.S. Presidential Election?";
    const result = getQuestionParts(marketName, MarketTypes.MULTI_SCALAR);
    expect(result).toBeUndefined();
  });

  it("should return undefined when multi-scalar market name has brackets in wrong order", () => {
    const marketName = "How many electoral votes will the ]party[ win in the 2024 U.S. Presidential Election?";
    const result = getQuestionParts(marketName, MarketTypes.MULTI_SCALAR);
    expect(result).toBeUndefined();
  });

  it("should return undefined when multi-scalar market name has empty outcomeType", () => {
    const marketName = "How many electoral votes will the [] win in the 2024 U.S. Presidential Election?";
    const result = getQuestionParts(marketName, MarketTypes.MULTI_SCALAR);
    expect(result).toBeUndefined();
  });

  it("should return undefined when multi-scalar market name has empty questionEnd", () => {
    const marketName = "How many electoral votes will the [party]";
    const result = getQuestionParts(marketName, MarketTypes.MULTI_SCALAR);
    expect(result).toBeUndefined();
  });

  it("should return undefined when multi-scalar market name has unit brackets in wrong position", () => {
    const marketName =
      "How many electoral votes will the [party] win in the 2024 U.S. Presidential Election? [votes] [extra]";
    const result = getQuestionParts(marketName, MarketTypes.MULTI_SCALAR);
    expect(result).toBeUndefined();
  });

  it("should return undefined when multi-scalar market name has empty unit", () => {
    const marketName = "How many electoral votes will the [party] win in the 2024 U.S. Presidential Election? []";
    const result = getQuestionParts(marketName, MarketTypes.MULTI_SCALAR);
    expect(result).toBeUndefined();
  });

  it("should return undefined when multi-scalar market name has unit without question mark", () => {
    const marketName = "How many electoral votes will the [party] win in the 2024 U.S. Presidential Election [votes]";
    const result = getQuestionParts(marketName, MarketTypes.MULTI_SCALAR);
    expect(result).toBeUndefined();
  });
});

describe("isMarketReliable", () => {
  const defaultCategory = "misc";
  const defaultLang = "en_US";

  it("should return true for scalar markets", () => {
    const marketName = "What will be the price of BTC on Jan 1st 2025?";
    const market = createMinimalMarket({
      type: "Generic",
      marketName: marketName,
      encodedQuestions: [encodeQuestionText("uint", marketName, [], defaultCategory, defaultLang)],
      lowerBound: 0n,
      upperBound: 100n,
      templateId: BigInt(REALITY_TEMPLATE_UINT),
      questions: [createDefaultQuestion()],
    });
    expect(getMarketType(market)).toBe(MarketTypes.SCALAR);
    expect(isMarketReliable(market)).toBe(true);
  });

  it("should return true for valid multi-scalar markets", () => {
    const questionStart = "How many electoral votes will the ";
    const questionEnd = " win in the 2024 U.S. Presidential Election?";
    const outcomeType = "party";
    const outcomes = ["Republican", "Democrat"];
    const market = createMinimalMarket({
      type: "Generic",
      marketName: `${questionStart}[${outcomeType}]${questionEnd}`,
      outcomes: outcomes,
      encodedQuestions: outcomes.map((outcome) =>
        encodeQuestionText("uint", `${questionStart}${outcome}${questionEnd}`, [], defaultCategory, defaultLang),
      ),
      lowerBound: 0n,
      upperBound: 100n,
      questions: [createDefaultQuestion(), createDefaultQuestion()],
      templateId: BigInt(REALITY_TEMPLATE_UINT),
    });
    expect(getMarketType(market)).toBe(MarketTypes.MULTI_SCALAR);
    expect(isMarketReliable(market)).toBe(true);
  });

  it("should return false for multi-scalar markets with manipulated questions (wrong start/end)", () => {
    const questionStart = "How many electoral votes will the ";
    const questionEnd = " win in the 2024 U.S. Presidential Election?";
    const outcomeType = "party";
    const outcomes = ["Republican", "Democrat"];
    const market = createMinimalMarket({
      type: "Generic",
      marketName: `${questionStart}[${outcomeType}]${questionEnd}`,
      outcomes: outcomes,
      encodedQuestions: [
        encodeQuestionText("uint", `WRONG_START ${outcomes[0]}${questionEnd}`, [], defaultCategory, defaultLang),
        encodeQuestionText("uint", `${questionStart}${outcomes[1]} WRONG_END`, [], defaultCategory, defaultLang),
      ],
      lowerBound: 0n,
      upperBound: 100n,
      questions: [createDefaultQuestion(), createDefaultQuestion()],
      templateId: BigInt(REALITY_TEMPLATE_UINT),
    });
    expect(getMarketType(market)).toBe(MarketTypes.MULTI_SCALAR);
    expect(isMarketReliable(market)).toBe(false);
  });

  it("should return true for valid multi-scalar markets with unit", () => {
    const questionStart = "How many series will ";
    const questionEnd = " win in the 2025 NBA playoffs?";
    const unit = "series";
    const outcomeType = "team";
    const outcomes = ["Lakers", "Celtics"];
    const market = createMinimalMarket({
      type: "Generic",
      marketName: `${questionStart}[${outcomeType}]${questionEnd} [${unit}]`,
      outcomes: outcomes,
      encodedQuestions: outcomes.map((outcome) =>
        encodeQuestionText(
          "uint",
          `${questionStart}${outcome}${questionEnd} [${unit}]`,
          [],
          defaultCategory,
          defaultLang,
        ),
      ),
      lowerBound: 0n,
      upperBound: 10n,
      questions: [createDefaultQuestion(), createDefaultQuestion()],
      templateId: BigInt(REALITY_TEMPLATE_UINT),
    });
    expect(getMarketType(market)).toBe(MarketTypes.MULTI_SCALAR);
    expect(isMarketReliable(market)).toBe(true);
  });

  it("should return true for valid categorical markets", () => {
    const marketName = "Who will win the 2024 U.S. Presidential Election?";
    const standardOutcomes = ["Republican", "Democrat", "Independent"];
    const market = createMinimalMarket({
      type: "Generic",
      marketName: marketName,
      outcomes: [...standardOutcomes, INVALID_RESULT_OUTCOME_TEXT],
      encodedQuestions: [
        encodeQuestionText("single-select", marketName, standardOutcomes, defaultCategory, defaultLang),
      ],
      templateId: BigInt(REALITY_TEMPLATE_SINGLE_SELECT),
      questions: [createDefaultQuestion()],
      wrappedTokens: Array(standardOutcomes.length + 1).fill(zeroAddress),
    });
    expect(getMarketType(market)).toBe(MarketTypes.CATEGORICAL);
    expect(market.templateId).toBe(BigInt(REALITY_TEMPLATE_SINGLE_SELECT));
    expect(isMarketReliable(market)).toBe(true);
  });

  it("should return false for categorical markets with mismatched outcomes in encoded question", () => {
    const marketName = "Who will win the 2024 U.S. Presidential Election?";
    const marketOutcomes = ["Republican", "Democrat", "Independent", INVALID_RESULT_OUTCOME_TEXT];
    const encodedOutcomes = ["Republican", "Democrat"];
    const market = createMinimalMarket({
      type: "Generic",
      marketName: marketName,
      outcomes: marketOutcomes,
      encodedQuestions: [
        encodeQuestionText("single-select", marketName, encodedOutcomes, defaultCategory, defaultLang),
      ],
      templateId: BigInt(REALITY_TEMPLATE_SINGLE_SELECT),
      questions: [createDefaultQuestion()],
      wrappedTokens: Array(marketOutcomes.length).fill(zeroAddress),
    });
    expect(getMarketType(market)).toBe(MarketTypes.CATEGORICAL);
    expect(market.templateId).toBe(BigInt(REALITY_TEMPLATE_SINGLE_SELECT));
    expect(isMarketReliable(market)).toBe(false);
  });

  it("should return true for valid multi-categorical markets", () => {
    const marketName = "Which parties will win seats in the 2024 Election?";
    const standardOutcomes = ["Party A", "Party B", "Party C"];
    const market = createMinimalMarket({
      type: "Generic",
      marketName: marketName,
      outcomes: [...standardOutcomes, INVALID_RESULT_OUTCOME_TEXT],
      encodedQuestions: [
        encodeQuestionText("multiple-select", marketName, standardOutcomes, defaultCategory, defaultLang),
      ],
      templateId: BigInt(REALITY_TEMPLATE_MULTIPLE_SELECT),
      questions: [createDefaultQuestion()],
      wrappedTokens: Array(standardOutcomes.length + 1).fill(zeroAddress),
    });
    expect(getMarketType(market)).toBe(MarketTypes.MULTI_CATEGORICAL);
    expect(market.templateId).toBe(BigInt(REALITY_TEMPLATE_MULTIPLE_SELECT));
    expect(isMarketReliable(market)).toBe(true);
  });

  it("should return false for multi-categorical markets with mismatched outcomes", () => {
    const marketName = "Which parties will win seats in the 2024 Election?";
    const marketOutcomes = ["Party A", "Party B", "Party C", INVALID_RESULT_OUTCOME_TEXT];
    const encodedOutcomes = ["Party A", "Party B"];
    const market = createMinimalMarket({
      type: "Generic",
      marketName: marketName,
      outcomes: marketOutcomes,
      encodedQuestions: [
        encodeQuestionText("multiple-select", marketName, encodedOutcomes, defaultCategory, defaultLang),
      ],
      templateId: BigInt(REALITY_TEMPLATE_MULTIPLE_SELECT),
      questions: [createDefaultQuestion()],
      wrappedTokens: Array(marketOutcomes.length).fill(zeroAddress),
    });
    expect(getMarketType(market)).toBe(MarketTypes.MULTI_CATEGORICAL);
    expect(market.templateId).toBe(BigInt(REALITY_TEMPLATE_MULTIPLE_SELECT));
    expect(isMarketReliable(market)).toBe(false);
  });

  it("should return true for valid futarchy markets", () => {
    const marketName = "Should we implement this proposal?";
    const outcomes = ["Yes", "No"];
    const market = createMinimalMarket({
      type: "Futarchy",
      marketName: marketName,
      outcomes: outcomes,
      encodedQuestions: [encodeQuestionText("single-select", marketName, outcomes, defaultCategory, defaultLang)],
      templateId: BigInt(REALITY_TEMPLATE_SINGLE_SELECT),
      questions: [createDefaultQuestion()],
    });
    expect(getMarketType(market)).toBe(MarketTypes.CATEGORICAL);
    expect(market.templateId).toBe(BigInt(REALITY_TEMPLATE_SINGLE_SELECT));
    expect(isMarketReliable(market)).toBe(true);
  });

  it("should return false for futarchy markets with wrong number of outcomes in encoded question", () => {
    const marketName = "Should we implement this proposal?";
    const marketOutcomes = ["Yes", "No"];
    const encodedOutcomes = ["Yes", "No", "Maybe"]; // Mismatch (Futarchy expects 2)
    const market = createMinimalMarket({
      type: "Futarchy",
      marketName: marketName,
      outcomes: marketOutcomes, // Market object still has 2 outcomes
      encodedQuestions: [
        encodeQuestionText("single-select", marketName, encodedOutcomes, defaultCategory, defaultLang),
      ],
      templateId: BigInt(REALITY_TEMPLATE_SINGLE_SELECT),
      questions: [createDefaultQuestion()],
    });
    expect(getMarketType(market)).toBe(MarketTypes.CATEGORICAL);
    expect(market.templateId).toBe(BigInt(REALITY_TEMPLATE_SINGLE_SELECT));
    expect(isMarketReliable(market)).toBe(false);
  });

  it("should return false for multi-scalar markets with invalid marketName format (no brackets)", () => {
    const questionStart = "How many electoral votes will the ";
    const questionEnd = " win in the 2024 U.S. Presidential Election?";
    const outcomes = ["Republican", "Democrat"];
    const market = createMinimalMarket({
      type: "Generic",
      marketName: "How many electoral votes will the party win in the 2024 U.S. Presidential Election?", // Missing brackets
      outcomes: outcomes,
      encodedQuestions: outcomes.map((outcome) =>
        encodeQuestionText("uint", `${questionStart}${outcome}${questionEnd}`, [], defaultCategory, defaultLang),
      ),
      lowerBound: 0n,
      upperBound: 100n,
      questions: [createDefaultQuestion(), createDefaultQuestion()],
      templateId: BigInt(REALITY_TEMPLATE_UINT),
    });
    expect(getMarketType(market)).toBe(MarketTypes.MULTI_SCALAR);
    expect(isMarketReliable(market)).toBe(false);
  });
});
