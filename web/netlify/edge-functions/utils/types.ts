import { gnosis, mainnet, sepolia } from "https://esm.sh/viem@2.17.5/chains";
import { REALITY_TEMPLATE_MULTIPLE_SELECT, REALITY_TEMPLATE_SINGLE_SELECT } from "./constants.ts";

const chainIds = [mainnet.id, sepolia.id, gnosis.id] as const;

export type SupportedChain = (typeof chainIds)[number];

export enum MarketStatus {
  NOT_OPEN = "not_open",
  OPEN = "open",
  ANSWER_NOT_FINAL = "answer_not_final",
  IN_DISPUTE = "in_dispute",
  PENDING_EXECUTION = "pending_execution",
  CLOSED = "closed",
}
export type VerificationStatus = "verified" | "verifying" | "challenged" | "not_verified";
export type VerificationResult = { status: VerificationStatus; itemID?: string };
interface MarketOffChainFields {
  chainId: SupportedChain;
  outcomesSupply: bigint;
  creator?: string | null;
  blockTimestamp?: number;
  verification?: VerificationResult;
  index?: number;
}

export interface Market extends MarketOffChainFields {
  id: Address;
  marketName: string;
  outcomes: readonly string[];
  wrappedTokens: Address[];
  parentMarket: {
    id: Address;
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
  encodedQuestions: readonly string[];
  lowerBound: bigint;
  upperBound: bigint;
  payoutReported: boolean;
}

export type Address = `0x${string}`;

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
}

export enum MarketTypes {
  CATEGORICAL = "categorical",
  SCALAR = "scalar",
  MULTI_CATEGORICAL = "multi_categorical",
  MULTI_SCALAR = "multi_scalar",
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
