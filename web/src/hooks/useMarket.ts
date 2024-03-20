import { SupportedChain } from "@/lib/chains";
import { graphQLClient, mapGraphMarket } from "@/lib/subgraph";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { marketFactoryAddress, readMarketViewGetMarket } from "./contracts/generated";
import { getSdk } from "./queries/generated";

export interface Question {
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
  lowerBound: bigint;
  upperBound: bigint;
  payoutReported: boolean;
  index?: number;
}

const useOnChainMarket = (marketId: Address, chainId: SupportedChain) => {
  return useQuery<Market | undefined, Error>({
    queryKey: ["useOnChainMarket", marketId, chainId],
    queryFn: async () => {
      return await readMarketViewGetMarket(config, {
        args: [marketFactoryAddress[chainId], marketId],
        chainId,
      });
    },
  });
};

const useGraphMarket = (marketId: Address, chainId: SupportedChain) => {
  return useQuery<Market, Error>({
    queryKey: ["useGraphMarket", marketId, chainId],
    queryFn: async () => {
      const client = graphQLClient(chainId);

      if (client) {
        const { market } = await getSdk(client).GetMarket({ id: marketId });

        if (!market) {
          throw new Error("Market not found");
        }

        return mapGraphMarket(market);
      }

      throw new Error("Subgraph not available");
    },
    retry: false,
  });
};

export const useMarket = (marketId: Address, chainId: SupportedChain) => {
  const onChainMarket = useOnChainMarket(marketId, chainId);
  const graphMarket = useGraphMarket(marketId, chainId);

  // if the subgraph is slow return first the onChain data, and update with the subgraph data once it's available
  return graphMarket.data ? graphMarket : onChainMarket;
};
