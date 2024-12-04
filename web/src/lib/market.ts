import { Market } from "@/hooks/useMarket";
import {
  REALITY_TEMPLATE_MULTIPLE_SELECT,
  REALITY_TEMPLATE_SINGLE_SELECT,
  REALITY_TEMPLATE_UINT,
  decodeQuestion,
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

export function hasOutcomes(marketType: MarketTypes) {
  return (
    marketType === MarketTypes.CATEGORICAL ||
    marketType === MarketTypes.MULTI_CATEGORICAL ||
    marketType === MarketTypes.MULTI_SCALAR
  );
}

export function isMarketReliable(market: Market) {
  if (getMarketType(market) === MarketTypes.SCALAR) {
    // nothing to check
    return true;
  }

  if (getMarketType(market) === MarketTypes.MULTI_SCALAR) {
    // check that the outcomeType wasn't manipulated
    const result = /(?<questionStart>.*)\[(?<outcomeType>.*)\](?<questionEnd>.*)/.exec(market.marketName);

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

    // -1 to exclude the INVALID outcome
    return decodedQuestion.outcomes.length === market.outcomes.length - 1;
  });
}

export function formatOdds(odd: number | undefined | null, marketType: MarketTypes) {
  if (!isOdd(odd)) {
    return "NA";
  }
  if (marketType === MarketTypes.SCALAR) {
    return odd === 0 ? 0 : (odd! / 100).toFixed(3);
  }

  return `${odd}%`;
}

export function isOdd(odd: number | undefined | null) {
  return typeof odd === "number" && !Number.isNaN(odd) && !isUndefined(odd);
}

export function getMarketEstimate(odds: number[], market: Market, convertToString?: boolean) {
  const { lowerBound, upperBound, marketName } = market;
  if (!isOdd(odds[0]) || !isOdd(odds[1])) {
    return "NA";
  }
  const estimate = ((odds[0] * Number(lowerBound) + odds[1] * Number(upperBound)) / 100).toFixed(0);
  if (!convertToString) {
    return estimate;
  }
  if (marketName.lastIndexOf("[") > -1) {
    return `${Number(estimate).toLocaleString()} ${marketName.slice(
      marketName.lastIndexOf("[") + 1,
      marketName.lastIndexOf("]"),
    )}`;
  }
  return Number(estimate).toLocaleString();
}
