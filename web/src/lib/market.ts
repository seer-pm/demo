import {
  FUTARCHY_LP_PAIRS_MAPPING,
  type FetchMarketParams,
  type Market as MarketBase,
  type MarketOffChainFields as MarketOffChainFieldsBase,
  MarketStatus,
  MarketTypes,
  type Question,
  type SerializedMarket as SerializedMarketBase,
  type Token0Token1,
  type VerificationResult,
  type VerificationStatus,
  fetchMarket as fetchMarketBase,
  fetchMarkets as fetchMarketsBase,
  getCollateralByIndex,
  getLiquidityPair,
  getLiquidityPairForToken,
  getMarketPoolsPairs,
  getMarketUnit,
  getToken0Token1,
  getTokensPairKey,
  isOdd,
} from "@seer-pm/sdk";
import { Address, zeroAddress } from "viem";
import { SupportedChain } from "./chains";
import {
  REALITY_TEMPLATE_MULTIPLE_SELECT,
  REALITY_TEMPLATE_SINGLE_SELECT,
  REALITY_TEMPLATE_UINT,
  decodeQuestion,
  displayScalarBound,
  isQuestionInDispute,
  isQuestionOpen,
  isQuestionPending,
  isQuestionUnanswered,
} from "./reality";
import { isTwoStringsEqual, isUndefined } from "./utils";

export {
  FUTARCHY_LP_PAIRS_MAPPING,
  MarketTypes,
  MarketStatus,
  getCollateralByIndex,
  getLiquidityPair,
  getLiquidityPairForToken,
  getMarketPoolsPairs,
  getMarketUnit,
  getToken0Token1,
  getTokensPairKey,
  isOdd,
};
export type { Question, Token0Token1, VerificationStatus, VerificationResult };

/** MarketOffChainFields with chainId as SupportedChain (web-specific). */
export type MarketOffChainFields = MarketOffChainFieldsBase<SupportedChain>;

/** Market type with chainId as SupportedChain (web-specific). */
export type Market = MarketBase<SupportedChain>;
/** SerializedMarket with chainId as SupportedChain (web-specific). */
export type SerializedMarket = SerializedMarketBase<SupportedChain>;

/** MarketsResult with Market[] = Market<SupportedChain>[] (web-specific). */
export type MarketsResult = { markets: Market[]; count: number; pages: number };

export type { FetchMarketParams };

/** Fetches a single market by id or url; returns Market<SupportedChain>. */
export async function fetchMarket(chainId: SupportedChain, idOrSlug: Address | string): Promise<Market | undefined> {
  return fetchMarketBase(chainId, idOrSlug);
}

/** Fetches markets with filters; returns MarketsResult<SupportedChain>. */
export async function fetchMarkets(params: FetchMarketParams = {}): Promise<MarketsResult> {
  return fetchMarketsBase(params) as Promise<MarketsResult>;
}

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

export function isInvalidOutcome(market: Market, outcomeIndex: number) {
  const hasInvalidOutcome = market.type === "Generic";
  return hasInvalidOutcome && outcomeIndex === market.wrappedTokens.length - 1;
}

export function getMultiScalarEstimate(market: Market, odds: number | null): { value: number; unit: string } | null {
  // Fixed upper bounds and units for specific market addresses
  const UPPER_BOUNDS: Record<Address, [number, string]> = {
    "0x1c21c59cd3b33be95a5b07bd7625b5f6d8024a76": [343, "seats"],
    "0xabe35cf0953169d9384f5953633f02996b4802f9": [577, "seats"],
    "0xbfea94c611fbe8a5353eddd94e025a2b3ad425d3": [128, "seats"],
  };

  const [upperBound, unit] = UPPER_BOUNDS[market.id] || [displayScalarBound(market.upperBound), getMarketUnit(market)];

  if (upperBound <= 0 || unit === "") {
    return null;
  }

  return {
    value: Math.round((upperBound * Number(odds)) / 100),
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

/**
 * Calculates the redeemed price for a specific outcome
 *
 * The redeemed price represents the payout ratio when the market is finalized.
 * For parent-child market relationships, this function handles the cascading payout calculations.
 *
 * @param market - The market containing payout information
 * @param tokenIndex - The index of the specific outcome token
 * @returns The redeemed price as a decimal ratio (0-1), or 0 if no payout is available
 */
export function getRedeemedPrice(market: Market, tokenIndex: number) {
  // If the market hasn't reported payouts yet, return 0
  if (!market.payoutReported) {
    return 0;
  }

  // Calculate the total sum of all payout numerators for this market
  const sumPayout = market.payoutNumerators.reduce((acc, curr) => acc + Number(curr), 0);

  // Check if this is a standalone market (no parent market)
  if (isTwoStringsEqual(market.parentMarket.id, zeroAddress)) {
    // Return the ratio of this outcome's payout to total payouts
    return Number(market.payoutNumerators[tokenIndex]) / sumPayout;
  }

  // For child markets, check if the parent market has reported payouts and this outcome is winning
  const isParentPayout =
    market.parentMarket.payoutReported && market.parentMarket.payoutNumerators[Number(market.parentOutcome)] > 0n;

  if (isParentPayout) {
    // Calculate total payouts for the parent market
    const sumParentPayout = market.parentMarket.payoutNumerators.reduce((acc, curr) => acc + Number(curr), 0);

    // Calculate the payout price for this specific outcome in the child market
    const payoutPrice = Number(market.payoutNumerators[tokenIndex]) / sumPayout;

    // Calculate the payout price for the parent market outcome
    const parentPayoutPrice =
      Number(market.parentMarket.payoutNumerators[Number(market.parentOutcome)]) / sumParentPayout;

    // Return the combined payout: child market outcome price × parent market outcome price
    return payoutPrice * parentPayoutPrice;
  }

  // If parent market hasn't reported payouts or this outcome isn't winning, return 0
  return 0;
}
