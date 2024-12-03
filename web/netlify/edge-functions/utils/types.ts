import { isUndefined } from "./common.ts";
import { SupportedChain } from "./config.ts";

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
  parentMarket: Address;
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

export type ColorConfig = {
  backgroundColor: string;
  color: string;
};
export const COLORS: Record<MarketStatus, ColorConfig> = {
  [MarketStatus.NOT_OPEN]: {
    backgroundColor: "#FBFBFB",
    color: "#25cdfe",
  },
  [MarketStatus.OPEN]: {
    backgroundColor: "#FBF8FF",
    color: "#9747FF",
  },
  [MarketStatus.ANSWER_NOT_FINAL]: {
    backgroundColor: "#FFF9F0",
    color: "#FF9900",
  },
  [MarketStatus.IN_DISPUTE]: {
    backgroundColor: "#F8FAFF",
    color: "#200FB9",
  },
  [MarketStatus.PENDING_EXECUTION]: {
    backgroundColor: "#E5FDFF",
    color: "#13C0CB",
  },
  [MarketStatus.CLOSED]: {
    backgroundColor: "#F0FBF2",
    color: "#00C42B",
  },
};

export const STATUS_TEXTS: Record<MarketStatus, (hasLiquidity?: boolean) => string> = {
  [MarketStatus.NOT_OPEN]: (hasLiquidity?: boolean) => {
    if (isUndefined(hasLiquidity)) {
      return "Reports not open yet";
    }

    return hasLiquidity ? "Trading Open" : "Liquidity Required";
  },
  [MarketStatus.OPEN]: () => "Reports open",
  [MarketStatus.ANSWER_NOT_FINAL]: () => "Waiting for answer",
  [MarketStatus.IN_DISPUTE]: () => "In Dispute",
  [MarketStatus.PENDING_EXECUTION]: () => "Pending execution",
  [MarketStatus.CLOSED]: () => "Closed",
};

export interface Token {
  address: Address;
  symbol: string;
  decimals: number;
  wrapped?: Token;
}

export enum Status {
  /** The item is not registered on the TCR and there are no pending requests. */
  Absent = "Absent",
  /** The item is registered on the TCR, but there is a pending removal request. These are sometimes also called removal requests. */
  ClearingRequested = "ClearingRequested",
  /** The item is registered and there are no pending requests. */
  Registered = "Registered",
  /** The item is not registered on the TCR, but there is a pending registration request. */
  RegistrationRequested = "RegistrationRequested",
}
