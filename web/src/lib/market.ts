import { Market } from "@/hooks/useMarket";
import { Address } from "viem";
import {
  REALITY_TEMPLATE_MULTIPLE_SELECT,
  REALITY_TEMPLATE_SINGLE_SELECT,
  REALITY_TEMPLATE_UINT,
  decodeQuestion,
  escapeJson,
  isQuestionInDispute,
  isQuestionOpen,
  isQuestionPending,
  isQuestionUnanswered,
} from "./reality";
import { formatDate, isUndefined } from "./utils";

export function hasOpenQuestions(market: Market) {
  // all the questions have the same opening_ts so we can use the first one to check it
  return isQuestionOpen(market.questions[0]);
}

export function hasAllUnansweredQuestions(market: Market) {
  return market.questions.every((question) => isQuestionUnanswered(question));
}

export function isInDispute(market: Market) {
  return market.questions.some((question) => isQuestionInDispute(question));
}

export function isWaitingResults(market: Market) {
  return market.questions.some((question) => isQuestionPending(question));
}

export function getOpeningTime(market: Market) {
  return `${formatDate(market.questions[0].opening_ts)} UTC`;
}

export function getClosingTime(market: Market) {
  return new Date(market.questions[0].opening_ts * 1000).toUTCString();
}

export enum MarketTypes {
  CATEGORICAL = "categorical",
  SCALAR = "scalar",
  MULTI_CATEGORICAL = "multi_categorical",
  MULTI_SCALAR = "multi_scalar",
}

export function getTemplateByMarketType(marketType: MarketTypes) {
  return {
    [MarketTypes.CATEGORICAL]: REALITY_TEMPLATE_SINGLE_SELECT,
    [MarketTypes.SCALAR]: REALITY_TEMPLATE_UINT,
    [MarketTypes.MULTI_CATEGORICAL]: REALITY_TEMPLATE_MULTIPLE_SELECT,
    [MarketTypes.MULTI_SCALAR]: REALITY_TEMPLATE_UINT,
  }[marketType];
}

export function getMarketType(market: Market): MarketTypes {
  if (market.templateId === BigInt(REALITY_TEMPLATE_SINGLE_SELECT)) {
    return MarketTypes.CATEGORICAL;
  }

  if (market.templateId === BigInt(REALITY_TEMPLATE_MULTIPLE_SELECT)) {
    return MarketTypes.MULTI_CATEGORICAL;
  }

  if (market.questions.length > 1) {
    return MarketTypes.MULTI_SCALAR;
  }

  return MarketTypes.SCALAR;
}

export function getMarketName(marketType: MarketTypes, marketName: string, unit: string) {
  return [MarketTypes.SCALAR, MarketTypes.MULTI_SCALAR].includes(marketType) && unit.trim()
    ? `${escapeJson(marketName)} [${escapeJson(unit)}]`
    : escapeJson(marketName);
}

export function getQuestionParts(
  marketName: string,
  marketType: MarketTypes,
): { questionStart: string; questionEnd: string; outcomeType: string } | undefined {
  if (marketType !== MarketTypes.MULTI_SCALAR) {
    return { questionStart: "", questionEnd: "", outcomeType: "" };
  }

  // splits the question, for example
  // How many electoral votes will the [party name] win in the 2024 U.S. Presidential Election?
  // // How many electoral votes will the [party name] win in the 2024 U.S. Presidential Election? [votes]
  const parts = marketName.split(/\[|\]/);

  if (parts.length !== 3 && parts.length !== 5) {
    // length = 3: question without unit
    // length = 5: question with unit
    return;
  }

  if (parts.length === 5) {
    // Check if the market name ends with "? [unit]" pattern using regex
    const unitRegex = /\?\s*\[[^\]]+\]$/;
    if (!unitRegex.test(marketName)) {
      return;
    }
  }

  // prevent this case ]outcome type[
  if (marketName.indexOf("[") > marketName.indexOf("]")) {
    return;
  }

  let [questionStart, outcomeType, questionEnd] = parts;
  if (!questionEnd?.trim() || !outcomeType.trim()) {
    return;
  }

  // add the unit
  if (parts.length === 5) {
    questionEnd += `[${parts[3]}]`;
  }

  return { questionStart, questionEnd, outcomeType };
}

export function hasOutcomes(marketType: MarketTypes) {
  return (
    marketType === MarketTypes.CATEGORICAL ||
    marketType === MarketTypes.MULTI_CATEGORICAL ||
    marketType === MarketTypes.MULTI_SCALAR
  );
}

export function isInvalidOutcome(market: Market, outcomeIndex: number) {
  const hasInvalidOutcome = market.type === "Generic";
  return hasInvalidOutcome && outcomeIndex === market.wrappedTokens.length - 1;
}

export function getMultiScalarEstimate(market: Market, odds: number): { value: number; unit: string } | null {
  const UPPER_BOUNDS: Record<Address, [number, string]> = {
    "0x1c21c59cd3b33be95a5b07bd7625b5f6d8024a76": [343, "seats"],
    "0xabe35cf0953169d9384f5953633f02996b4802f9": [577, "seats"],
  };

  const [upperBound, unit] = UPPER_BOUNDS[market.id] || [Number(market.upperBound), getMarketUnit(market)];

  if (upperBound <= 0 || unit === "") {
    return null;
  }

  return {
    value: Math.round((upperBound * odds) / 100),
    unit,
  };
}

export function isMarketReliable(market: Market) {
  if (getMarketType(market) === MarketTypes.SCALAR) {
    // nothing to check
    return true;
  }

  if (getMarketType(market) === MarketTypes.MULTI_SCALAR) {
    // check that the outcomeType wasn't manipulated
    const result = /(?<questionStart>.*?)\[(?<outcomeType>.*?)\](?<questionEnd>.*)/.exec(market.marketName);

    if (result === null) {
      // the regex fails if market name doesn't include the [outcomeType]
      return false;
    }

    const { questionStart, questionEnd /*, outcomeType*/ } = result.groups as {
      questionStart: string;
      questionEnd: string;
      outcomeType: string;
    };

    // each question should have the same questionStart and questionEnd as the market name, otherwise the outcomeType was manipulated
    return market.encodedQuestions.every((encodedQuestion) => {
      const decodedQuestion = decodeQuestion(encodedQuestion);

      return decodedQuestion.question.startsWith(questionStart) && decodedQuestion.question.endsWith(questionEnd);
    });
  }

  // categorial & multi categorical markets
  return market.encodedQuestions.every((encodedQuestion) => {
    const decodedQuestion = decodeQuestion(encodedQuestion);

    // check number of outcomes
    if (isUndefined(decodedQuestion.outcomes)) {
      // this shouldn't happen
      return false;
    }

    const hasInvalidOutcome = market.type === "Generic";

    if (hasInvalidOutcome) {
      // -1 to exclude the INVALID outcome
      return decodedQuestion.outcomes.length === market.outcomes.length - 1;
    }

    // futarchy markets have 2 outcomes (Yes & No)
    return decodedQuestion.outcomes.length === 2;
  });
}

export function isOdd(odd: number | undefined | null) {
  return typeof odd === "number" && !Number.isNaN(odd) && !isUndefined(odd);
}

export function getMarketEstimate(odds: number[], market: Market, convertToString?: boolean) {
  const { lowerBound, upperBound } = market;
  if (!isOdd(odds[0]) || !isOdd(odds[1])) {
    return "NA";
  }
  const estimate = (odds[0] * Number(lowerBound) + odds[1] * Number(upperBound)) / 100;
  if (!convertToString) {
    return estimate;
  }
  const marketUnit = getMarketUnit(market);
  if (marketUnit) {
    return `${Number(estimate).toLocaleString()} ${marketUnit}`;
  }
  return Number(estimate).toLocaleString();
}

export function getMarketUnit(market: Market) {
  const marketName = market.marketName;
  if (marketName.lastIndexOf("[") > -1) {
    return `${marketName.slice(marketName.lastIndexOf("[") + 1, marketName.lastIndexOf("]"))}`;
  }

  return "";
}

export function getCollateralByIndex(market: Market, index: number) {
  if (market.type === "Generic") {
    return market.collateralToken;
  }
  return index < 2 ? market.collateralToken1 : market.collateralToken2;
}

export function getMarketPoolsPairs(market: Market): Token0Token1[] {
  const pools = new Set<Token0Token1>();
  const tokens = market.type === "Generic" ? market.wrappedTokens : market.wrappedTokens.slice(0, 2);
  tokens.forEach((_, index) => {
    pools.add(getLiquidityPair(market, index));
  });
  return [...pools];
}

// outcome0 pairs with outcome2
// outcome1 pairs with outcome3
// outcome2 pairs with outcome0
// outcome3 pairs with outcome1
export const FUTARCHY_LP_PAIRS_MAPPING = [2, 3, 0, 1];

export function getLiquidityPair(market: Market, outcomeIndex: number): Token0Token1 {
  if (market.type === "Generic") {
    return getToken0Token1(market.wrappedTokens[outcomeIndex], market.collateralToken);
  }

  return getToken0Token1(
    market.wrappedTokens[outcomeIndex],
    market.wrappedTokens[FUTARCHY_LP_PAIRS_MAPPING[outcomeIndex]],
  );
}

export function getLiquidityPairForToken(market: Market, outcomeIndex: number): Address {
  if (market.type === "Generic") {
    return market.collateralToken;
  }

  return market.wrappedTokens[FUTARCHY_LP_PAIRS_MAPPING[outcomeIndex]];
}

export type Token0Token1 = { token1: Address; token0: Address };

export function getToken0Token1(token0: Address, token1: Address): Token0Token1 {
  return token0.toLocaleLowerCase() > token1.toLocaleLowerCase()
    ? { token0: token1.toLocaleLowerCase() as Address, token1: token0.toLocaleLowerCase() as Address }
    : { token0: token0.toLocaleLowerCase() as Address, token1: token1.toLocaleLowerCase() as Address };
}

export function getCollateralFromDexTx(market: Market, tokenIn: Address, tokenOut: Address) {
  if (market.type === "Generic") {
    return market.collateralToken;
  }

  return tokenIn.toLocaleLowerCase() === market.collateralToken1.toLocaleLowerCase() ? tokenIn : tokenOut;
}

export function getOutcomeSlotCount(market: Market) {
  if (market.type === "Generic") {
    return market.outcomes.length;
  }

  return 2;
}
export function getOutcomes(outcomes: string[], marketType: MarketTypes) {
  if (marketType === MarketTypes.SCALAR) {
    return ["DOWN", "UP", ...outcomes.slice(2)];
  }

  return outcomes;
}
