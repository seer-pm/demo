import type { Address } from "viem";

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

export type MarketOffChainFields<ChainId = number> = {
  chainId: ChainId;
  factory?: Address;
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
  odds: (number | null)[];
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

export type Market<ChainId = number> = MarketOffChainFields<ChainId> & {
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

export type SerializedMarket<ChainId = number> = Omit<
  Market<ChainId>,
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
  parentMarket: Omit<Market<ChainId>["parentMarket"], "payoutNumerators"> & {
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

export function serializeMarket<ChainId>(market: Market<ChainId>): SerializedMarket<ChainId> {
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

/** Overload: when deserializing API response (chainId is number) but typing as C (e.g. SupportedChain). */
export function deserializeMarket<C>(market: SerializedMarket<number>): Market<C>;
export function deserializeMarket<ChainId>(market: SerializedMarket<ChainId>): Market<ChainId>;
export function deserializeMarket(market: SerializedMarket): Market {
  const result = {
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
  return result as Market;
}
