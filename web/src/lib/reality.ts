import { realityAddress } from "@/hooks/contracts/generated";
import { Market, Question } from "@/hooks/useMarket";
import { MarketStatus } from "@/hooks/useMarketStatus";
import { compareAsc } from "date-fns/compareAsc";
import { fromUnixTime } from "date-fns/fromUnixTime";
import { Hex, formatEther, hexToNumber, numberToHex } from "viem";
import { SupportedChain } from "./chains";

export const REALITY_TEMPLATE_UINT = 1;
export const REALITY_TEMPLATE_SINGLE_SELECT = 2;
export const REALITY_TEMPLATE_MULTIPLE_SELECT = 3;

export const INVALID_RESULT = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
export const ANSWERED_TOO_SOON = "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe";

export type Outcome = string;

export type FormEventOutcomeValue = number | string;

export function escapeJson(txt: string) {
  return JSON.stringify(txt).replace(/^"|"$/g, "");
}

export function unescapeJson(txt: string) {
  return txt.replace(/\\"/g, '"');
}

export function formatOutcome(outcome: FormEventOutcomeValue | FormEventOutcomeValue[] | ""): Hex {
  if (outcome === "") {
    throw Error("Invalid outcome");
  }

  if (typeof outcome === "object") {
    // multi-select

    // INVALID_RESULT and ANSWERED_TOO_SOON are incompatible with multi-select
    if (outcome.includes(INVALID_RESULT)) {
      return INVALID_RESULT;
    }

    if (outcome.includes(ANSWERED_TOO_SOON)) {
      return ANSWERED_TOO_SOON;
    }

    const answerChoice = (outcome as number[]).reduce(
      (partialSum: number, value: number) => partialSum + 2 ** Number(value),
      0,
    );
    return numberToHex(answerChoice, { size: 32 });
  }

  // single-select
  if (outcome === ANSWERED_TOO_SOON || outcome === INVALID_RESULT) {
    return outcome as Hex;
  }

  return numberToHex(BigInt(outcome), { size: 32 });
}

function getMultiSelectAnswers(value: number): number[] {
  const answers = value.toString(2);
  const indexes = [];

  for (let i = 0; i < answers.length; i++) {
    if (answers[i] === "1") {
      indexes.push(answers.length - i - 1);
    }
  }

  return indexes;
}

export function getAnswerText(
  question: Question,
  outcomes: Market["outcomes"],
  templateId: bigint,
  noAnswerText = "Not answered yet",
): string {
  if (question.finalize_ts === 0) {
    return noAnswerText;
  }

  if (question.best_answer === INVALID_RESULT) {
    return "Invalid result";
  }

  if (question.best_answer === ANSWERED_TOO_SOON) {
    return "Answered too soon";
  }

  if (Number(templateId) === REALITY_TEMPLATE_UINT) {
    return formatEther(BigInt(question.best_answer));
  }

  const outcomeIndex = hexToNumber(question.best_answer);

  if (Number(templateId) === REALITY_TEMPLATE_MULTIPLE_SELECT) {
    return getMultiSelectAnswers(outcomeIndex)
      .map((answer) => outcomes[answer] || noAnswerText)
      .join(", ");
  }

  return outcomes[outcomeIndex] || noAnswerText;
}

export function getCurrentBond(currentBond: bigint, minBond: bigint) {
  return currentBond === 0n ? minBond : currentBond * 2n;
}

export function isFinalized(question: Question) {
  const finalizeTs = Number(question.finalize_ts);
  return !question.is_pending_arbitration && finalizeTs > 0 && compareAsc(new Date(), fromUnixTime(finalizeTs)) === 1;
}

export function isQuestionOpen(question: Question) {
  const now = Math.round(new Date().getTime() / 1000);

  return question.opening_ts < now;
}

export function isQuestionUnanswered(question: Question) {
  return question.finalize_ts === 0;
}

export function isQuestionInDispute(question: Question) {
  return question.is_pending_arbitration;
}

export function isQuestionPending(question: Question) {
  return question.finalize_ts === 0 || !isFinalized(question);
}

export const getQuestionStatus = (question: Question) => {
  if (!isQuestionOpen(question)) {
    return MarketStatus.NOT_OPEN;
  }

  if (isQuestionUnanswered(question)) {
    return MarketStatus.OPEN;
  }

  if (isQuestionInDispute(question)) {
    return MarketStatus.IN_DISPUTE;
  }

  if (isQuestionPending(question)) {
    return MarketStatus.ANSWER_NOT_FINAL;
  }

  return MarketStatus.CLOSED;
};

export function getRealityLink(chainId: SupportedChain, questionId: `0x${string}`) {
  return `https://reality.eth.limo/app/#!/network/${chainId}/question/${realityAddress[chainId]}-${questionId}`;
}
