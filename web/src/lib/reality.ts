import { Market, Question } from "@/hooks/useMarket";
import compareAsc from "date-fns/compareAsc";
import fromUnixTime from "date-fns/fromUnixTime";
import { Hex, hexToNumber, pad, toHex } from "viem";

export const REALITY_TEMPLATE_SINGLE_SELECT = 2;
export const REALITY_TEMPLATE_MULTIPLE_SELECT = "3";

export const INVALID_RESULT = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
export const ANSWERED_TOO_SOON = "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe";

export type Outcome = string;

export type FormEventOutcomeValue = number | string | typeof INVALID_RESULT | typeof ANSWERED_TOO_SOON;

function encodeOutcomes(outcomes: string[]) {
  return JSON.stringify(outcomes).replace(/^\[/, "").replace(/\]$/, "");
}

export function encodeQuestionText(
  qtype: "bool" | "single-select" | "multiple-select" | "uint" | "datetime",
  txt: string,
  outcomes: string[],
  category: string,
  lang?: string,
) {
  let qText = JSON.stringify(txt).replace(/^"|"$/g, "");
  const delim = "\u241f";

  if (qtype === "single-select" || qtype === "multiple-select") {
    qText = qText + delim + encodeOutcomes(outcomes);
  }
  qText = qText + delim + category + delim + (lang || "en_US");
  return qText;
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
    return pad(toHex(answerChoice), { size: 32 });
  }

  // single-select
  if (outcome === ANSWERED_TOO_SOON || outcome === INVALID_RESULT) {
    return outcome as Hex;
  }

  return pad(toHex(Number(outcome)), { size: 32 });
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

export function getAnswerText(market: Market, noAnswerText = "Not answered yet"): string {
  if (market.question.finalize_ts === 0) {
    return noAnswerText;
  }

  if (market.question.best_answer === INVALID_RESULT) {
    return "Invalid result";
  }

  if (market.question.best_answer === ANSWERED_TOO_SOON) {
    return "Answered too soon";
  }

  const outcomeIndex = hexToNumber(market.question.best_answer);

  if (market.templateId.toString() === REALITY_TEMPLATE_MULTIPLE_SELECT) {
    return getMultiSelectAnswers(outcomeIndex)
      .map((answer) => market.outcomes[answer] || noAnswerText)
      .join(", ");
  }

  return market.outcomes[outcomeIndex] || noAnswerText;
}

export function getCurrentBond(currentBond: bigint, minBond: bigint) {
  return currentBond === 0n ? minBond : currentBond * 2n;
}

export function isFinalized(question: Question) {
  const finalizeTs = Number(question.finalize_ts);
  return !question.is_pending_arbitration && finalizeTs > 0 && compareAsc(new Date(), fromUnixTime(finalizeTs)) === 1;
}
