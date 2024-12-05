import { unescapeJson } from "./common.ts";
import { SupportedChain } from "./config.ts";
import { INVALID_RESULT_OUTCOME, INVALID_RESULT_OUTCOME_TEXT, SEER_SUBGRAPH_URLS } from "./constants.ts";
import { Address, Market, VerificationResult } from "./types.ts";

export async function fetchMarket(marketId: string, chainId: string, verificationStatusList) {
  if (!marketId) {
    return;
  }
  const query = `{
    market(id: "${marketId.toLocaleLowerCase()}") {
      id
      marketName
      outcomes
      wrappedTokens
      parentMarket
      parentOutcome
      parentCollectionId
      conditionId
      questionId
      templateId
      questions {
        question {
          id
          arbitrator
          opening_ts
          timeout
          finalize_ts
          is_pending_arbitration
          best_answer
          bond
          min_bond
        }
      }
      openingTs
      encodedQuestions
      lowerBound
      upperBound
      payoutReported
      factory
      creator
      outcomesSupply
      blockTimestamp
    }
  }`;
  const results = await fetch(SEER_SUBGRAPH_URLS[chainId]!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
    }),
  });
  const json = await results.json();

  return (
    json?.data?.market &&
    mapGraphMarket(json.data.market, {
      chainId: Number(chainId),
      verification: verificationStatusList?.[marketId.toLowerCase() as Address] ?? { status: "not_verified" },
    })
  );
}

function mapGraphMarket(
  market,
  extra: { chainId: SupportedChain; verification: VerificationResult | undefined },
): Market {
  return {
    ...market,
    id: market.id as Address,
    marketName: unescapeJson(market.marketName),
    outcomes: market.outcomes.map((outcome) => {
      if (outcome === INVALID_RESULT_OUTCOME) {
        return INVALID_RESULT_OUTCOME_TEXT;
      }
      return unescapeJson(outcome);
    }),
    parentMarket: market.parentMarket as Address,
    parentOutcome: BigInt(market.parentOutcome),
    templateId: BigInt(market.templateId),
    openingTs: Number(market.openingTs),
    questions: market.questions.map((question) => {
      return {
        ...question.question,
        id: question.question.id as `0x${string}`,
        opening_ts: Number(question.question.opening_ts),
        timeout: Number(question.question.timeout),
        finalize_ts: Number(question.question.finalize_ts),
        bond: BigInt(question.question.bond),
        min_bond: BigInt(question.question.min_bond),
      };
    }),
    outcomesSupply: BigInt(market.outcomesSupply),
    lowerBound: BigInt(market.lowerBound),
    upperBound: BigInt(market.upperBound),
    blockTimestamp: Number(market.blockTimestamp),
    ...extra,
  };
}
