import { Market, fetchMarkets } from "@/lib/market";
import { useQuery } from "@tanstack/react-query";
import { zeroAddress } from "viem";

export const useRelatedMarkets = (market: Market) => {
  return useQuery<Market[], Error>({
    queryKey: ["useRelatedMarkets", market.chainId, market.id],
    queryFn: async () => {
      const relatedMarkets = (await fetchMarkets({ chainsList: [market.chainId.toString()], parentMarket: market.id }))
        .markets;

      if (market.parentMarket.id !== zeroAddress) {
        relatedMarkets.push(
          ...(await fetchMarkets({ chainsList: [market.chainId.toString()], parentMarket: market.parentMarket.id }))
            .markets,
        );
      }

      return relatedMarkets;
    },
  });
};
