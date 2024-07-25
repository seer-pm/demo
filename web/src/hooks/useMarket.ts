import { SupportedChain } from "@/lib/chains";
import { MarketTypes, getMarketType } from "@/lib/market";
import { unescapeJson } from "@/lib/reality";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { marketFactoryAddress, readMarketViewGetMarket } from "./contracts/generated";

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

const useOnChainMarket = (marketId: Address, chainId: SupportedChain) => {
  return useQuery<Market | undefined, Error>({
    queryKey: ["useMarket", "useOnChainMarket", marketId, chainId],
    queryFn: async () => {
      return mapOnChainMarket(
        await readMarketViewGetMarket(config, {
          args: [marketFactoryAddress[chainId], marketId],
          chainId,
        }),
      );
    },
  });
};

export const useMarket = (marketId: Address, chainId: SupportedChain) => {
  return useOnChainMarket(marketId, chainId);
};
