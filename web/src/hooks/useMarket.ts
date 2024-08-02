import { SupportedChain } from "@/lib/chains";
import { MarketTypes, getMarketType } from "@/lib/market";
import { unescapeJson } from "@/lib/reality";
import { graphQLClient } from "@/lib/subgraph";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { marketFactoryAddress, readMarketViewGetMarket } from "./contracts/generated";
import { GetMarketQuery, getSdk } from "./queries/generated";

export interface Question {
  id: `0x${string}`;
  arbitrator: Address;
  opening_ts: number;
  timeout: number;
  finalize_ts: number;
  is_pending_arbitration: boolean;
  best_answer: `0x${string}`;
  bond: bigint;
  min_bond: bigint;
}

export interface Market {
  id: Address;
  marketName: string;
  outcomes: readonly string[];
  outcomesSupply: bigint;
  conditionId: `0x${string}`;
  questionId: `0x${string}`;
  templateId: bigint;
  questions: readonly Question[];
  encodedQuestions: readonly string[];
  lowerBound: bigint;
  upperBound: bigint;
  payoutReported: boolean;
  index?: number;
}

export function mapOnChainMarket(onChainMarket: Awaited<ReturnType<typeof readMarketViewGetMarket>>): Market {
  const market: Market = {
    ...onChainMarket,
    marketName: unescapeJson(onChainMarket.marketName),
    outcomes: onChainMarket.outcomes.map(unescapeJson),
    questions: onChainMarket.questions.map(
      (question, i) =>
        ({
          id: onChainMarket.questionsIds[i],
          ...question,
        }) as Question,
    ),
  };

  if (getMarketType(market) === MarketTypes.SCALAR) {
    const outcomes: string[] = market.outcomes.slice();
    outcomes[0] = `DOWN [${Number(market.lowerBound)},${Number(market.upperBound)}]`;
    outcomes[1] = `UP [${Number(market.lowerBound)},${Number(market.upperBound)}]`;

    market.outcomes = outcomes;
  }

  return market;
}

const useGraphMarket = (marketId: Address, chainId: SupportedChain) => {
  return useQuery<GetMarketQuery["market"] | undefined, Error>({
    queryKey: ["useMarket", "useGraphMarket", marketId],
    queryFn: async () => {
      const client = graphQLClient(chainId);

      if (client) {
        const { market } = await getSdk(client).GetMarket({ id: marketId.toLocaleLowerCase() });

        if (!market) {
          throw new Error("Market not found");
        }

        return market;
      }

      throw new Error("Subgraph not available");
    },
  });
};

const useOnChainMarket = (marketId: Address, chainId: SupportedChain) => {
  const { data: graphMarket } = useGraphMarket(marketId, chainId);
  const factory = graphMarket?.factory || marketFactoryAddress[chainId];
  return useQuery<Market | undefined, Error>({
    queryKey: ["useMarket", "useOnChainMarket", marketId, chainId],
    queryFn: async () => {
      return mapOnChainMarket(
        await readMarketViewGetMarket(config, {
          args: [factory, marketId],
          chainId,
        }),
      );
    },
  });
};

export const useMarket = (marketId: Address, chainId: SupportedChain) => {
  return useOnChainMarket(marketId, chainId);
};
