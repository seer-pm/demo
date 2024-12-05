import React from "https://esm.sh/react@18.2.0";
import { CalendarIcon } from "../icons.tsx";
import { getMarketType, getOpeningTime } from "../market.ts";
import { COLORS, Market, MarketStatus } from "../types.ts";
import QuestionLine from "./QuestionLine.tsx";

interface MarketInfoProps {
  market: Market;
  marketStatus: MarketStatus;
}
export default function MarketInfo({ market, marketStatus }: MarketInfoProps) {
  if (marketStatus === MarketStatus.NOT_OPEN) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: COLORS[marketStatus].color,
        }}
      >
        <CalendarIcon />
        <p style={{ margin: "0", fontSize: "14px" }}>Opening at {getOpeningTime(market)}</p>
      </div>
    );
  }

  // const marketType = getMarketType(market);

  // return (
  //   <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
  //     {market.questions.map((question, i) => (
  //       <QuestionLine key={question.id} {...{ question, questionIndex: i, market, marketType, marketStatus }} />
  //     ))}
  //   </div>
  // );
  return null;
}
