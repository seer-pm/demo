import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { MarketViewAbi } from "../abi/MarketViewAbi";
import { DEFAULT_CHAIN, getConfigAddress } from "../lib/config";
import { config } from "../wagmi";
import { useMarketFactory } from "./useMarketFactory";

export interface Market {
  marketName: string;
  outcomes: string[];
  conditionId: `0x${string}`;
  questionId: `0x${string}`;
  templateId: bigint;
  encodedQuestion: string;
  oracle: Address;
  pools: Address[];
}

export const useMarket = (marketId: Address) => {
  const { chainId = DEFAULT_CHAIN } = useAccount();

  const { data: marketFactory } = useMarketFactory(chainId);

  return useQuery<Market | undefined, Error>({
    enabled: !!marketId && !!marketFactory,
    queryKey: ["useMarket", marketId],
    queryFn: async () => {
      const market = await readContract(config, {
        abi: MarketViewAbi,
        address: getConfigAddress("MARKET_VIEW", chainId),
        functionName: "getMarket",
        args: [marketFactory?.conditionalTokens!, marketId],
      });

      return {
        marketName: market[0],
        outcomes: market[1] as string[],
        conditionId: market[2],
        questionId: market[3],
        templateId: market[4],
        encodedQuestion: market[5],
        oracle: market[6],
        pools: market[7] as Address[],
      };
    },
  });
};
