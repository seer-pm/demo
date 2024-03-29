import { GetMarketsQuery } from "@/hooks/queries/generated";
import { Market } from "@/hooks/useMarket";
import { GraphQLClient } from "graphql-request";
import { SupportedChain } from "./chains";
import { SUBGRAPH_URLS } from "./config";

export function graphQLClient(chainId: SupportedChain) {
  const subgraphUrl = SUBGRAPH_URLS[chainId];

  if (!subgraphUrl) {
    return;
  }

  return new GraphQLClient(subgraphUrl);
}

export function mapGraphMarket(market: GetMarketsQuery["markets"][number]): Market {
  return {
    ...market,
    id: market.id as `0x${string}`,
    lowerBound: BigInt(market.lowerBound),
    upperBound: BigInt(market.upperBound),
    templateId: BigInt(market.templateId),
    outcomesSupply: BigInt(market.outcomesSupply),
    index: Number(market.index),
    questions: market.questions
      .map((marketQuestion) => {
        const question = marketQuestion.question;
        return {
          ...question,
          id: question.id as `0x${string}`,
          opening_ts: Number(question.opening_ts),
          timeout: Number(question.timeout),
          finalize_ts: Number(question.finalize_ts),
          bond: BigInt(question.bond),
          min_bond: BigInt(question.min_bond),
        };
      })
      .sort((a, b) => a.index - b.index),
  };
}
