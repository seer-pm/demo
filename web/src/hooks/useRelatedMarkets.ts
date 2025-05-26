import { SupportedChain } from "@/lib/chains";
import { Market } from "@/lib/market";
import { fetchMarkets } from "@/lib/markets-search";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";

export const useRelatedMarkets = (chainId: SupportedChain, marketId: Address) => {
  return useQuery<Market[], Error>({
    queryKey: ["useRelatedMarkets", chainId, marketId],
    queryFn: async () => {
      return await fetchMarkets({ chainsList: [chainId.toString()], parentMarket: marketId });
    },
  });
};
