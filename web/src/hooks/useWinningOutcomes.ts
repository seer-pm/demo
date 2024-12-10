import { RouterAbi } from "@/abi/RouterAbi";
import { getRouterAddress } from "@/lib/config";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { Address } from "viem";
import { Market } from "./useMarket";
import { MarketStatus } from "./useMarketStatus";

export function useWinningOutcomes(market: Market, marketStatus?: MarketStatus) {
  const routerAddress = getRouterAddress(market);

  return useQuery({
    queryKey: ["winningOutcomes", market.conditionId, routerAddress],
    enabled: marketStatus === MarketStatus.CLOSED && !!routerAddress,
    queryFn: async () => {
      return await readContract(config, {
        abi: RouterAbi,
        address: routerAddress as Address,
        functionName: "getWinningOutcomes",
        args: [market.conditionId],
        chainId: market.chainId,
      });
    },
  });
}
