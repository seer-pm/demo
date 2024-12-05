import { formatEther, hexToNumber } from "https://esm.sh/viem@2.17.5";
import {
  ANSWERED_TOO_SOON,
  INVALID_RESULT,
  REALITY_TEMPLATE_MULTIPLE_SELECT,
  REALITY_TEMPLATE_UINT,
} from "./constants.ts";
import { Market, Question } from "./types.ts";

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

export function getMultiSelectAnswers(value: number): number[] {
  const answers = value.toString(2);
  const indexes: number[] = [];

  for (let i = 0; i < answers.length; i++) {
    if (answers[i] === "1") {
      indexes.push(answers.length - i - 1);
    }
  }

  return indexes;
}
