import { RouterAbi } from "@/abi/RouterAbi";
import { SupportedChain } from "@/lib/chains";
import { getRouterAddress } from "@/lib/config";
import { hasAllUnansweredQuestions, hasOpenQuestions, isWaitingResults } from "@/lib/market";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { Market } from "./useMarket";

export enum MarketStatus {
  NOT_OPEN = 1,
  OPEN = 2,
  ANSWER_NOT_FINAL = 3,
  PENDING_EXECUTION = 4,
  CLOSED = 5,
}

export const useMarketStatus = (market?: Market, chainId?: SupportedChain) => {
  return useQuery<MarketStatus | undefined, Error>({
    enabled: !!market && !!chainId,
    queryKey: ["useMarketStatus", market?.id, chainId],
    queryFn: async () => {
      if (!hasOpenQuestions(market!)) {
        return MarketStatus.NOT_OPEN;
      }

      if (hasAllUnansweredQuestions(market!)) {
        return MarketStatus.OPEN;
      }

      if (isWaitingResults(market!)) {
        return MarketStatus.ANSWER_NOT_FINAL;
      }

      // TODO: add this to MarketView
      const isPayoutReported = await readContract(config, {
        abi: RouterAbi,
        address: getRouterAddress(chainId),
        functionName: "isPayoutReported",
        args: [market?.conditionId!],
      });

      if (!isPayoutReported) {
        return MarketStatus.PENDING_EXECUTION;
      }

      return MarketStatus.CLOSED;
    },
  });
};
