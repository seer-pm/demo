import { type Market, decodeQuestion, getMarketStatus, getRealityLink } from "@seer-pm/sdk";
import { MarketHeader } from "./Header/MarketHeader";
import { MarketInfo } from "./Header/MarketInfo";

export function MarketRules({ market }: { market: Market }) {
  return (
    <section id="event-rules" className="event-rules-readable" aria-labelledby="event-rules-heading">
      <h2 id="event-rules-heading">Rules</h2>
      <div className="event-rules-copy">
        {market.encodedQuestions.map((encoded, index) => (
          <p key={`${index}-${encoded}`}>{decodeQuestion(encoded).question}</p>
        ))}
        <p>Review the linked Reality.eth question for the resolution criteria, reported answer and dispute status.</p>
      </div>
      {market.blockTimestamp ? (
        <p className="event-rules-date">
          Market opened:{" "}
          {new Date(market.blockTimestamp * 1000).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          })}
        </p>
      ) : null}
      <div className="event-resolver">
        <img src="/assets/reality-icon.jpg" alt="" />
        <div>
          <span>Resolution oracle</span>
          {market.questions.map((question, index) => (
            <a key={question.id} href={getRealityLink(market.chainId, question.id)} target="_blank" rel="noreferrer">
              Reality.eth{market.questions.length > 1 ? ` · Question ${index + 1}` : ""} ↗
            </a>
          ))}
        </div>
      </div>
      <div className="event-resolution-status">
        <MarketInfo market={market} marketStatus={getMarketStatus(market)} isPreview={false} />
      </div>
      <details className="event-technical-details">
        <summary>Additional market details</summary>
        <MarketHeader market={market} images={market.images} embedded />
      </details>
    </section>
  );
}
