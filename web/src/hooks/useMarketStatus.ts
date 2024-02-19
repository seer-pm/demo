import { RouterAbi } from "@/abi/RouterAbi";
import { getConfigAddress } from "@/lib/config";
import { isOpen, isWaitingResults } from "@/lib/market";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { Market } from "./useMarket";

export enum MarketStatus {
  OPEN = 1,
  WAITING_RESULTS = 2,
  WAITING_PAYOUT_REPORT = 3,
  CLOSED = 4,
}

export const useMarketStatus = (market?: Market, chainId?: number) => {
  return useQuery<MarketStatus | undefined, Error>({
    enabled: !!market && !!chainId,
    queryKey: ["useMarketStatus", market?.id, chainId],
    queryFn: async () => {
      if (isOpen(market!)) {
        return MarketStatus.OPEN;
      }

      if (isWaitingResults(market!)) {
        return MarketStatus.WAITING_RESULTS;
      }

      const isPayoutReported = await readContract(config, {
        abi: RouterAbi,
        address: getConfigAddress("ROUTER", chainId),
        functionName: "isPayoutReported",
        args: [market?.conditionId!],
      });

      if (!isPayoutReported) {
        return MarketStatus.WAITING_PAYOUT_REPORT;
      }

      return MarketStatus.CLOSED;
    },
  });
};
