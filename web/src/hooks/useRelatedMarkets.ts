import { SupportedChain } from "@/lib/chains";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { Market } from "./useMarket";
import { fetchMarkets } from "./useMarkets";

export const useRelatedMarkets = (chainId: SupportedChain, marketId: Address) => {
  return useQuery<Market[], Error>({
    queryKey: ["useRelatedMarkets", chainId, marketId],
    queryFn: async () => {
      return await fetchMarkets(chainId, { parentMarket: marketId });
    },
  });
};
