import { type Market, decodeQuestion, getMarketStatus, getMarketType, getQuestionParts } from "@seer-pm/sdk";
import { MarketResolution } from "./MarketResolution";

function trimToWordStart(prefix: string) {
  const cut = prefix.lastIndexOf(" ");
  return cut === -1 ? "" : prefix.slice(0, cut + 1);
}

function trimToWordEnd(suffix: string) {
  const cut = suffix.indexOf(" ");
  return cut === -1 ? "" : suffix.slice(cut);
}

/**
 * Multi-scalar markets ask the same question once per outcome. The texts share a prefix and a
 * suffix around the outcome name, so the shared part is shown once with a slot where the outcome
 * goes. Each row of the resolution card names its outcome, and the modal shows the full text of
 * the question being answered.
 */
function questionTemplate(texts: string[]): { prefix: string; suffix: string } | null {
  if (texts.length < 2) {
    return null;
  }
  const shortest = Math.min(...texts.map((text) => text.length));
  let prefixLength = 0;
  while (prefixLength < shortest && texts.every((text) => text[prefixLength] === texts[0][prefixLength])) {
    prefixLength++;
  }
  let suffixLength = 0;
  while (
    suffixLength < shortest - prefixLength &&
    texts.every((text) => text[text.length - 1 - suffixLength] === texts[0][texts[0].length - 1 - suffixLength])
  ) {
    suffixLength++;
  }
  if (prefixLength + suffixLength >= shortest) {
    return null;
  }
  return {
    prefix: trimToWordStart(texts[0].slice(0, prefixLength)),
    suffix: trimToWordEnd(texts[0].slice(texts[0].length - suffixLength)),
  };
}

function QuestionText({ market }: { market: Market }) {
  const texts = market.encodedQuestions.map((encoded) => decodeQuestion(encoded).question);
  const template = questionTemplate(texts);

  if (!template) {
    return <p>{texts[0]}</p>;
  }

  const slot = getQuestionParts(market.marketName, getMarketType(market))?.outcomeType.trim() || "outcome";

  return (
    <>
      <p>
        {template.prefix}
        <span className="event-rules-slot">{slot}</span>
        {template.suffix}
      </p>
    </>
  );
}

export function MarketRules({ market }: { market: Market }) {
  return (
    <section id="event-rules" className="event-rules-readable" aria-labelledby="event-rules-heading">
      <h2 id="event-rules-heading">Rules &amp; settlement</h2>
      <div className="event-rules-copy">
        <QuestionText market={market} />
      </div>
      <MarketResolution market={market} marketStatus={getMarketStatus(market)} />
    </section>
  );
}
