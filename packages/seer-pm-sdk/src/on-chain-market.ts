import { zeroAddress, zeroHash } from "viem";
import { readMarketViewGetMarket } from "../generated/generated-market-view";
import { INVALID_RESULT_OUTCOME, INVALID_RESULT_OUTCOME_TEXT, MarketTypes, getMarketType, getOutcomes } from "./market";
import type { Market, MarketOffChainFields, Question } from "./market-types";
import { unescapeJson } from "./reality";

/** Return type of readMarketViewGetMarket (MarketView.getMarket). */
export type OnChainMarket = Awaited<ReturnType<typeof readMarketViewGetMarket>>;

/**
 * Maps raw on-chain market view data plus off-chain fields into a full Market.
 */
export function mapOnChainMarket(onChainMarket: OnChainMarket, offChainFields: MarketOffChainFields): Market {
  const market: Market = {
    ...onChainMarket,
    type: onChainMarket.collateralToken1 === zeroAddress ? "Generic" : "Futarchy",
    wrappedTokens: onChainMarket.wrappedTokens.slice(),
    marketName: unescapeJson(onChainMarket.marketName),
    outcomes: onChainMarket.outcomes.map((outcome) => {
      if (outcome === INVALID_RESULT_OUTCOME) {
        return INVALID_RESULT_OUTCOME_TEXT;
      }
      return unescapeJson(outcome);
    }),
    questions: onChainMarket.questions.map(
      (question, i) =>
        ({
          id: onChainMarket.questionsIds[i],
          base_question: zeroHash,
          ...question,
        }) as Question,
    ),
    openingTs: onChainMarket.questions[0].opening_ts,
    finalizeTs: 0,
    ...offChainFields,
  };

  if (getMarketType(market) === MarketTypes.SCALAR) {
    market.outcomes = getOutcomes(market.outcomes.slice(), getMarketType(market));
  }
  return market;
}
