import { formatDistanceStrict } from "date-fns";
import { Address } from "viem";
import { SupportedChain } from "./chains";
import {
  REALITY_TEMPLATE_MULTIPLE_SELECT,
  REALITY_TEMPLATE_SINGLE_SELECT,
  REALITY_TEMPLATE_UINT,
  decodeQuestion,
  displayScalarBound,
  escapeJson,
  isQuestionInDispute,
  isQuestionOpen,
  isQuestionPending,
  isQuestionUnanswered,
} from "./reality";
import { isUndefined } from "./utils";

export interface Question {
  id: `0x${string}`;
  arbitrator: Address;
  opening_ts: number;
  timeout: number;
  finalize_ts: number;
  is_pending_arbitration: boolean;
  best_answer: `0x${string}`;
  bond: bigint;
  min_bond: bigint;
  base_question: `0x${string}`;
}

export type VerificationStatus = "verified" | "verifying" | "challenged" | "not_verified";
export type VerificationResult = { status: VerificationStatus; itemID?: string; deadline?: number };
export type MarketOffChainFields = {
  chainId: SupportedChain;
  outcomesSupply: bigint;
  liquidityUSD: number;
  incentive: number;
  hasLiquidity: boolean;
  categories: string[];
  poolBalance: ({
    token0: {
      symbol: string;
      balance: number;
    };
    token1: {
      symbol: string;
      balance: number;
    };
  } | null)[];
  odds: number[];
  creator?: string | null;
  blockTimestamp?: number;
  verification?: VerificationResult;
  images?: { market: string; outcomes: string[] } | undefined;
  index?: number;
  url: string;
};

export enum MarketStatus {
  NOT_OPEN = "not_open",
  OPEN = "open",
  ANSWER_NOT_FINAL = "answer_not_final",
  IN_DISPUTE = "in_dispute",
  PENDING_EXECUTION = "pending_execution",
  CLOSED = "closed",
}

export type Market = MarketOffChainFields & {
  id: Address;
  type: "Generic" | "Futarchy";
  marketName: string;
  outcomes: readonly string[];
  collateralToken: Address;
  collateralToken1: Address;
  collateralToken2: Address;
  wrappedTokens: Address[];
  parentMarket: {
    id: Address;
    conditionId: `0x${string}`;
    payoutReported: boolean;
    payoutNumerators: readonly bigint[];
  };
  parentOutcome: bigint;
  //MarketView's outcomesSupply is buggy
  //outcomesSupply: bigint;
  parentCollectionId: `0x${string}`;
  conditionId: `0x${string}`;
  questionId: `0x${string}`;
  templateId: bigint;
  questions: readonly Question[];
  openingTs: number;
  finalizeTs: number;
  encodedQuestions: readonly string[];
  lowerBound: bigint;
  upperBound: bigint;
  payoutReported: boolean;
  payoutNumerators: readonly bigint[];
};

export type SerializedMarket = Omit<
  Market,
  | "outcomesSupply"
  | "parentOutcome"
  | "templateId"
  | "questions"
  | "lowerBound"
  | "upperBound"
  | "payoutNumerators"
  | "parentMarket"
> & {
  outcomesSupply: string;
  parentMarket: Omit<Market["parentMarket"], "payoutNumerators"> & {
    payoutNumerators: readonly string[];
  };
  parentOutcome: string;
  templateId: string;
  questions: Array<
    Omit<Question, "bond" | "min_bond"> & {
      bond: string;
      min_bond: string;
    }
  >;
  lowerBound: string;
  upperBound: string;
  payoutNumerators: readonly string[];
};

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
    images: market.images
      ? {
          market: `https://cdn.kleros.link${market.images.market}`,
          outcomes: ((market.images.outcomes || []) as string[]).map((path) => `https://cdn.kleros.link${path}`),
        }
      : undefined,
  };
}

export function getChallengeRemainingTime(market: Market) {
  if (!isUndefined(market.verification) && market.verification.status === "verifying" && market.verification.deadline) {
    const now = Date.now();
    if (market.verification.deadline * 1000 < now) {
      return;
    }
    return formatDistanceStrict(market.verification.deadline * 1000, now);
  }
}
