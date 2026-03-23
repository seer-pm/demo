import type { Market } from "@seer-pm/sdk";
import { getMarketPositions } from "@seer-pm/sdk";
import type { MarketPosition } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { useClient } from "wagmi";

export const useMarketPositions = (address: Address | undefined, market: Market) => {
  const client = useClient({ chainId: market.chainId });

  return useQuery<MarketPosition[] | undefined, Error>({
    enabled: !!client && !!address && market.wrappedTokens.length > 0,
    queryKey: ["useMarketPositions", address, market.id],
    refetchOnWindowFocus: true,
    queryFn: async () =>
      getMarketPositions({
        client: client!,
        address: address!,
        wrappedTokens: market.wrappedTokens!,
        chainId: market.chainId,
      }),
  });
};
