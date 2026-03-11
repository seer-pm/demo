import {
  type Market,
  MarketStatus,
  MarketTypes,
  REALITY_TEMPLATE_MULTIPLE_SELECT,
  REALITY_TEMPLATE_SINGLE_SELECT,
  REALITY_TEMPLATE_UINT,
  type SerializedMarket,
  getMarketType,
} from "@seer-pm/sdk";
import {
  decodeQuestion,
  isQuestionInDispute,
  isQuestionOpen,
  isQuestionPending,
  isQuestionUnanswered,
} from "@seer-pm/sdk";
import type { Address } from "viem";
import { isUndefined } from "./utils";

export const getMarketStatus = (market: Market) => {
  if (!hasOpenQuestions(market!)) {
    return MarketStatus.NOT_OPEN;
  }

  if (hasAllUnansweredQuestions(market!)) {
    return MarketStatus.OPEN;
  }

  if (isInDispute(market!)) {
    return MarketStatus.IN_DISPUTE;
  }

  if (isWaitingResults(market!)) {
    return MarketStatus.ANSWER_NOT_FINAL;
  }

  if (!market!.payoutReported) {
    return MarketStatus.PENDING_EXECUTION;
  }

  return MarketStatus.CLOSED;
};

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

export function getClosingTime(market: Market) {
  return new Date(market.questions[0].opening_ts * 1000).toUTCString();
}

export function getTemplateByMarketType(marketType: MarketTypes) {
  return {
    [MarketTypes.CATEGORICAL]: REALITY_TEMPLATE_SINGLE_SELECT,
    [MarketTypes.SCALAR]: REALITY_TEMPLATE_UINT,
    [MarketTypes.MULTI_CATEGORICAL]: REALITY_TEMPLATE_MULTIPLE_SELECT,
    [MarketTypes.MULTI_SCALAR]: REALITY_TEMPLATE_UINT,
  }[marketType];
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

export function serializeMarket(market: Market): SerializedMarket {
  return {
    ...market,
    outcomesSupply: market.outcomesSupply.toString(),
    parentMarket: {
      ...market.parentMarket,
      payoutNumerators: market.parentMarket.payoutNumerators.map((pn) => pn.toString()),
    },
    parentOutcome: market.parentOutcome.toString(),
    templateId: market.templateId.toString(),
    questions: market.questions.map((question) => ({
      ...question,
      bond: question.bond.toString(),
      min_bond: question.min_bond.toString(),
    })),
    lowerBound: market.lowerBound.toString(),
    upperBound: market.upperBound.toString(),
    payoutNumerators: market.payoutNumerators.map((pn) => pn.toString()),
  };
}

export function deserializeMarket(market: SerializedMarket): Market {
  return {
    ...market,
    outcomesSupply: BigInt(market.outcomesSupply),
    parentMarket: {
      ...market.parentMarket,
      payoutNumerators: market.parentMarket.payoutNumerators.map((pn) => BigInt(pn)),
    },
    parentOutcome: BigInt(market.parentOutcome),
    templateId: BigInt(market.templateId),
    questions: market.questions.map((question) => ({
      ...question,
      bond: BigInt(question.bond),
      min_bond: BigInt(question.min_bond),
    })),
    lowerBound: BigInt(market.lowerBound),
    upperBound: BigInt(market.upperBound),
    payoutNumerators: market.payoutNumerators.map((pn) => BigInt(pn)),
  };
}
