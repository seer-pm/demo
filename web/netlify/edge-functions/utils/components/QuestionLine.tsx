import React from "https://esm.sh/react@18.2.0";
import { CheckCircleIcon, HourGlassIcon, RightArrow } from "../icons.tsx";
import { MarketTypes, getQuestionStatus, isFinalized } from "../market.ts";
import { getAnswerText } from "../reality.ts";
import { COLORS, Market, MarketStatus, Question } from "../types.ts";

export default function QuestionLine({
  question,
  questionIndex,
  market,
  marketType,
  marketStatus,
}: {
  question: Question;
  questionIndex: number;
  market: Market;
  marketType: MarketTypes;
  marketStatus: MarketStatus;
}) {
  const questionStatus = getQuestionStatus(question);

  if (questionStatus === MarketStatus.NOT_OPEN || questionStatus === MarketStatus.OPEN) {
    // this will never happen
    return null;
  }
  const colors =
    COLORS[marketStatus === MarketStatus.PENDING_EXECUTION ? MarketStatus.PENDING_EXECUTION : questionStatus];
  return (
    <div style={{ display: "flex", color: colors.color }}>
      <AnswerColumn {...{ question, questionIndex, market, marketType, marketStatus, questionStatus }} />
    </div>
  );
}

function AnswerColumn({
  marketStatus,
  marketType,
  question,
  questionStatus,
  questionIndex,
  market,
}: {
  marketStatus: MarketStatus;
  marketType: MarketTypes;
  question: Question;
  questionStatus: MarketStatus;
  questionIndex: number;
  market: Market;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      {(marketStatus === MarketStatus.PENDING_EXECUTION || questionStatus === MarketStatus.IN_DISPUTE) && (
        <HourGlassIcon />
      )}
      {questionStatus === MarketStatus.ANSWER_NOT_FINAL &&
        (isFinalized(question) ? <CheckCircleIcon className="text-success-primary" /> : <HourGlassIcon />)}
      {marketType === MarketTypes.MULTI_SCALAR && (
        <p style={{ margin: "0" }}>
          <span>{market.outcomes[questionIndex]}</span>
          <span style={{ color: "#e5e5e5" }}>|</span>
        </p>
      )}
      {questionStatus === MarketStatus.CLOSED && marketStatus !== MarketStatus.PENDING_EXECUTION && <CheckCircleIcon />}
      {question.finalize_ts > 0 && (
        <p style={{ whiteSpace: "nowrap", margin: "0" }}>
          Answer: {getAnswerText(question, market.outcomes, market.templateId)}
        </p>
      )}
    </div>
  );
}
