import { realityAddress } from "@/hooks/contracts/generated-reality";
import { Market, Question } from "@/hooks/useMarket";
import { MarketStatus } from "@/hooks/useMarketStatus";
import { compareAsc } from "date-fns/compareAsc";
import { fromUnixTime } from "date-fns/fromUnixTime";
import { Hex, formatEther, hexToNumber, numberToHex } from "viem";
import { SupportedChain } from "./chains";
import { getConfigNumber } from "./config";

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

export function getMultiSelectAnswers(value: number): number[] {
  const answers = value.toString(2);
  const indexes = [];

  for (let i = 0; i < answers.length; i++) {
    if (answers[i] === "1") {
      indexes.push(answers.length - i - 1);
    }
  }

  return indexes;
}

const overrideAnswerText: Record<`0x${string}`, string> = {
  "0x279061d3049ad315f10358b579d24e44058dc3fed7387f66d6e6950c1adf4dbf": "120",
  "0x723c67fd785dc5d653805c276b4123ded8a0e941ebbd7d0014f3554c188bd463": "208",
  "0x261d589233f189fcd3fb6e093fffdcd135b9348836d2c2dfe23eb7c4b7441ca8": "85",
  "0x2d5865b62af4a4a5a4e3a776e58bcc3d2cc9552ca70c954dc511e7aa03e71ba7": "0",
  "0x0c68e62a358cd85f954ed524017c9a72c7298905ba6b2cd71ccdaea18d3544a4": "152",
  "0x1d7dad8f80b30d8045f67b51c37f346d6bd5f798b3292af40f18dcb39a588525": "64",
  "0x1d47e7fc07b61d441234b8770bee734c3a5aafd7d4e64750d2973d43993f3d7e": "0",
  "0x13fc8e8fdfac473d5e9263604b36c6f203545125109976f9ffadee64b912289c": "1",
};

export function getAnswerText(
  question: Question,
  outcomes: Market["outcomes"],
  templateId: bigint,
  noAnswerText = "Not answered yet",
): string {
  if (overrideAnswerText[question.id] !== undefined) {
    return overrideAnswerText[question.id];
  }

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
    return isScalarBoundInWei(BigInt(question.best_answer))
      ? formatEther(BigInt(question.best_answer))
      : BigInt(question.best_answer).toString();
  }

  const outcomeIndex = hexToNumber(question.best_answer);

  if (Number(templateId) === REALITY_TEMPLATE_MULTIPLE_SELECT) {
    return getMultiSelectAnswers(outcomeIndex)
      .map((answer) => outcomes[answer] || noAnswerText)
      .join(", ");
  }

  return outcomes[outcomeIndex] || noAnswerText;
}

export function getCurrentBond(currentBond: bigint, minBond: bigint, chainId: SupportedChain) {
  const newBond = currentBond === 0n ? minBond : currentBond * 2n;
  return newBond > 0n ? newBond : getConfigNumber("MIN_BOND", chainId);
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

export function encodeOutcomes(outcomes: string[]) {
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
  //console.log('using template_id', template_id);
  if (qtype === "single-select" || qtype === "multiple-select") {
    qText = qText + delim + encodeOutcomes(outcomes);
  }
  qText = qText + delim + category + delim + (typeof lang === "undefined" || lang === "" ? "en_US" : lang);
  return qText;
}

export function decodeQuestion(encodedQuestion: string): {
  question: string;
  outcomes: string[] | undefined;
  category: string;
  lang: string;
} {
  const delim = "\u241f";
  const parts = encodedQuestion.split(delim);

  let question: string;
  let outcomes: string[] | undefined;
  let _outcomes: string;
  let category: string;
  let lang: string;

  if (parts.length === 4) {
    [question, _outcomes, category, lang] = parts;
    try {
      outcomes = JSON.parse(`[${unescapeJson(_outcomes)}]`);
    } catch {
      outcomes = undefined;
    }
  } else {
    [question, category, lang] = parts;
  }

  return {
    question: unescapeJson(question),
    outcomes,
    category,
    lang,
  };
}

export function isScalarBoundInWei(bound: bigint) {
  // NOTE: This is a backwards compatibility check.
  // Going forward, all scalar bounds will be in wei (1e18) format.
  // However, some older markets used basic units (regular integers).
  // We detect the format based on the size of the number.

  // We use 1e10 as a threshold to distinguish between regular numbers and numbers in wei (1e18) format
  // Numbers below 1e10 are assumed to be in their basic units (like regular integers)
  // Numbers above 1e10 are assumed to be in wei format (1e18 decimals) and need to be formatted with formatEther

  return bound > BigInt(1e10);
}

export function displayScalarBound(bound: bigint): string {
  if (isScalarBoundInWei(bound)) {
    return formatEther(bound);
  }

  return bound.toString();
}
