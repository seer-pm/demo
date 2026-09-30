import { formatEther, hexToNumber, numberToHex } from "viem";
import type { Hex } from "viem";
import { realityAddress } from "../generated/contracts/reality";
import type { SupportedChain } from "./chains";
import type { Question } from "./market-types";
import type { Market } from "./market-types";
import { MarketStatus } from "./market-types";

/** Reality.eth template id for uint (scalar) questions. */
export const REALITY_TEMPLATE_UINT = 1;
/** Reality.eth template id for single-select (categorical) questions. */
export const REALITY_TEMPLATE_SINGLE_SELECT = 2;
/** Reality.eth template id for multiple-select questions. */
export const REALITY_TEMPLATE_MULTIPLE_SELECT = 3;

/** Hex value for invalid result outcome in Reality.eth. */
export const INVALID_RESULT = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
/** Hex value for "answered too soon" in Reality.eth. */
export const ANSWERED_TOO_SOON = "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe";

export function unescapeJson(txt: string): string {
  return txt.replace(/\\"/g, '"');
}

export function escapeJson(txt: string): string {
  return JSON.stringify(txt).replace(/^"|"$/g, "");
}

export function isScalarBoundInWei(bound: bigint): boolean {
  // NOTE: This is a backwards compatibility check.
  // Going forward, all scalar bounds will be in wei (1e18) format.
  // However, some older markets used basic units (regular integers).
  // We detect the format based on the size of the number.
  // We use 1e10 as a threshold to distinguish between regular numbers and numbers in wei (1e18) format.
  return bound > BigInt(1e10);
}

export function displayScalarBound(bound: bigint): number {
  if (isScalarBoundInWei(bound)) {
    return Number(formatEther(bound));
  }
  return Number(bound);
}

/** Next bond for answering; uses fallbackMinBond when computed bond would be 0 (e.g. chain min). */
export function getCurrentBond(currentBond: bigint, minBond: bigint, fallbackMinBond?: bigint): bigint {
  const newBond = currentBond === 0n ? minBond : currentBond * 2n;
  return newBond > 0n ? newBond : (fallbackMinBond ?? minBond);
}

export function isFinalized(question: Question): boolean {
  const finalizeTs = Number(question.finalize_ts);
  const now = Math.floor(Date.now() / 1000);
  return !question.is_pending_arbitration && finalizeTs > 0 && now > finalizeTs;
}

export function isQuestionOpen(question: Question): boolean {
  const now = Math.round(Date.now() / 1000);
  return question.opening_ts < now;
}

export function isQuestionUnanswered(question: Question): boolean {
  return question.finalize_ts === 0;
}

export function isQuestionInDispute(question: Question): boolean {
  return question.is_pending_arbitration;
}

export function isQuestionPending(question: Question): boolean {
  return question.finalize_ts === 0 || !isFinalized(question);
}

export function getQuestionStatus(question: Question): MarketStatus {
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
}

export function getRealityLink(chainId: SupportedChain, questionId: `0x${string}`): string {
  const address = realityAddress[chainId as keyof typeof realityAddress];
  return `https://reality.eth.limo/app/#!/network/${chainId}/question/${address}-${questionId}`;
}

export function encodeOutcomes(outcomes: string[]): string {
  return JSON.stringify(outcomes).replace(/^\[/, "").replace(/\]$/, "");
}

export function encodeQuestionText(
  qtype: "bool" | "single-select" | "multiple-select" | "uint" | "datetime",
  txt: string,
  outcomes: string[],
  category: string,
  lang?: string,
): string {
  let qText = JSON.stringify(txt).replace(/^"|"$/g, "");
  const delim = "\u241f";
  if (qtype === "single-select" || qtype === "multiple-select") {
    qText = qText + delim + encodeOutcomes(outcomes);
  }
  const language = typeof lang === "undefined" || lang === "" ? "en_US" : lang;
  qText = qText + delim + escapeJson(category) + delim + escapeJson(language);
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

export function decodeOutcomes(market: Market, question: Question): string[] {
  const questionIndex = market.questions.findIndex((q) => q.id === question.id);
  return decodeQuestion(market.encodedQuestions[questionIndex]).outcomes || [];
}

/**
 * Text of the built-in Reality.eth templates the market factories ask questions with. The Reality
 * contract defines them, so they are the same on every chain.
 */
const REALITY_TEMPLATES: Record<number, string> = {
  [REALITY_TEMPLATE_UINT]: '{"title": "%s", "type": "uint", "decimals": 18, "category": "%s", "lang": "%s"}',
  [REALITY_TEMPLATE_SINGLE_SELECT]:
    '{"title": "%s", "type": "single-select", "outcomes": [%s], "category": "%s", "lang": "%s"}',
  [REALITY_TEMPLATE_MULTIPLE_SELECT]:
    '{"title": "%s", "type": "multiple-select", "outcomes": [%s], "category": "%s", "lang": "%s"}',
};

function parsesAsJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

/** True when `param` can sit between two quotes without ending the JSON string early. */
function isJsonStringBody(param: string): boolean {
  return parsesAsJson(`"${param}"`);
}

/** True when `param` is the inside of a JSON array that holds only strings. */
function isOutcomesBody(param: string): boolean {
  try {
    return (JSON.parse(`[${param}]`) as unknown[]).every((outcome) => typeof outcome === "string");
  } catch {
    return false;
  }
}

/**
 * Tells whether a parameter of an encoded question alters the JSON that Reality.eth builds from it.
 *
 * Reality pastes every parameter into the template as plain text, and the market factories accept
 * any text. A parameter that holds an unescaped quote closes its string and adds keys of its own.
 * The last duplicate of a key wins, so reality.eth and the arbitrator can show outcomes, decimals
 * or a title that differ from the ones the market pays out on.
 */
export function hasInjectedParameters(templateId: number, encodedQuestion: string): boolean {
  const template = REALITY_TEMPLATES[templateId];
  if (template === undefined) {
    return false;
  }

  const delim = "␟";
  const params = encodedQuestion.split(delim);
  const placeholders = template.split("%s").length - 1;

  // A separator inside a field moves every later parameter into the wrong placeholder.
  if (params.length !== placeholders) {
    return true;
  }

  const outcomesIndex = template.includes("[%s]") ? 1 : -1;
  if (params.every((param, i) => (i === outcomesIndex ? isOutcomesBody(param) : isJsonStringBody(param)))) {
    return false;
  }

  // A malformed parameter that leaves the JSON unparseable misleads nobody: reality.eth shows the
  // raw text as a broken question. One that still parses has changed what the question says.
  let next = 0;
  return parsesAsJson(template.replace(/%s/g, () => params[next++]));
}

/** Outcome label type (string). */
export type Outcome = string;

/** Form/UI value for a single outcome: index (number) or special hex. */
export type FormEventOutcomeValue = number | string;

/** Encode form outcome value(s) to Reality.eth answer hex (32 bytes). */
export function formatOutcome(outcome: FormEventOutcomeValue | FormEventOutcomeValue[] | ""): Hex {
  if (outcome === "") {
    throw Error("Invalid outcome");
  }

  if (typeof outcome === "object") {
    if (outcome.includes(INVALID_RESULT)) {
      return INVALID_RESULT;
    }
    if (outcome.includes(ANSWERED_TOO_SOON)) {
      return ANSWERED_TOO_SOON;
    }
    const answerChoice = (outcome as number[]).reduce(
      (partialSum: bigint, value: number) => partialSum | (1n << BigInt(value)),
      0n,
    );
    return numberToHex(answerChoice, { size: 32 });
  }

  if (outcome === ANSWERED_TOO_SOON || outcome === INVALID_RESULT) {
    return outcome as Hex;
  }
  return numberToHex(BigInt(outcome), { size: 32 });
}

/** Decode a multi-select answer value (bitmask) to array of outcome indices. */
export function getMultiSelectAnswers(value: bigint): number[] {
  const indexes: number[] = [];
  let bit = 0;
  let mask = value;
  while (mask > 0n) {
    if (mask & 1n) {
      indexes.push(bit);
    }
    mask >>= 1n;
    bit++;
  }
  return indexes;
}

/** Override display text for specific question IDs (legacy/data fixes). */
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

/** Human-readable answer text for a question given outcomes and template. */
export function getAnswerText(
  question: Question,
  outcomes: readonly string[],
  template: number,
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

  if (template === REALITY_TEMPLATE_UINT) {
    return isScalarBoundInWei(BigInt(question.best_answer))
      ? formatEther(BigInt(question.best_answer))
      : BigInt(question.best_answer).toString();
  }

  const outcomeIndex = hexToNumber(question.best_answer);
  if (template === REALITY_TEMPLATE_MULTIPLE_SELECT) {
    return getMultiSelectAnswers(BigInt(question.best_answer))
      .map((answer) => outcomes[answer] || noAnswerText)
      .join(", ");
  }

  return outcomes[outcomeIndex] || noAnswerText;
}

/** Answer text for a question using market outcomes and template. */
export function getAnswerTextFromMarket(question: Question, market: Market, noAnswerText = "Not answered yet"): string {
  return getAnswerText(question, market.outcomes, Number(market.templateId), noAnswerText);
}
