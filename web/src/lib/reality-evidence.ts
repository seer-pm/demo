import { realityAbi, realityAddress } from "@seer-pm/sdk/contracts/reality";
import { type Address, type Hex, type TransactionReceipt, isAddressEqual, parseEventLogs } from "viem";

export const REALITY_EVIDENCE_LIMIT = 2000;

export type RealityAnswerHistoryEntry = {
  id: string;
  answer: Hex | null;
  user: Address;
  bond: string;
  timestamp: number;
  transactionHash: Hex;
  evidence?: string;
};

/** Builds the evidence endpoint URL for one Reality question. */
export function realityEvidencePath(chainId: number, questionId: Hex) {
  return `/.netlify/functions/reality-answer-evidence?chainId=${chainId}&questionId=${questionId}`;
}

/** Finds the paid Reality answer matching the question, value and wallet in a confirmed receipt. */
export function findRealityAnswer(
  receipt: TransactionReceipt,
  chainId: keyof typeof realityAddress,
  questionId: Hex,
  answer: Hex,
  author: Address,
) {
  if (receipt.status !== "success") return undefined;

  return parseEventLogs({
    abi: realityAbi,
    eventName: "LogNewAnswer",
    logs: receipt.logs,
  }).find(
    ({ address, args }) =>
      isAddressEqual(address, realityAddress[chainId]) &&
      args.question_id.toLowerCase() === questionId.toLowerCase() &&
      args.answer.toLowerCase() === answer.toLowerCase() &&
      isAddressEqual(args.user, author) &&
      args.bond > 0n &&
      !args.is_commitment,
  );
}
