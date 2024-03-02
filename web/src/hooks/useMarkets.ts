import { MarketViewAbi } from "@/abi/MarketViewAbi";
import { getConfigAddress } from "@/lib/config";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { Market } from "./useMarket";

export const useMarkets = (chainId: number) => {
  return useQuery<Market[] | undefined, Error>({
    queryKey: ["useMarkets", chainId],
    queryFn: async () => {
      const markets = await readContract(config, {
        address: getConfigAddress("MarketView", chainId),
        abi: MarketViewAbi,
        functionName: "getMarkets",
        args: [BigInt(50), getConfigAddress("MarketFactory", chainId)],
        chainId,
      });

      return markets.filter((m) => {
        const hasOpenQuestions = m.questions.find((q) => q.opening_ts !== 0);
        return hasOpenQuestions;
      });
    },
  });
};
