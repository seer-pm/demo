import { RouterAbi } from "@/abi/RouterAbi";
import { SupportedChain } from "@/lib/chains";
import { getRouterAddress } from "@/lib/config";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { Address } from "viem";
import { MarketStatus } from "./useMarketStatus";

export function useWinningOutcomes(conditionId: Address, chainId: SupportedChain, marketStatus?: MarketStatus) {
  const routerAddress = getRouterAddress(chainId);

  return useQuery({
    queryKey: ["winningOutcomes", conditionId, routerAddress],
    enabled: marketStatus === MarketStatus.CLOSED && !!routerAddress,
    queryFn: async () => {
      return await readContract(config, {
        abi: RouterAbi,
        address: routerAddress as Address,
        functionName: "getWinningOutcomes",
        args: [conditionId],
        chainId,
      });
    },
  });
}
