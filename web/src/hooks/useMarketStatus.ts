import { RouterAbi } from "@/abi/RouterAbi";
import { getConfigAddress } from "@/lib/config";
import { isFinalized } from "@/lib/reality";
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
      const now = Math.round(new Date().getTime() / 1000);

      if (market!.question.opening_ts > now) {
        return MarketStatus.OPEN;
      }

      if (market!.question.finalize_ts === 0 || !isFinalized(market!.question)) {
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
