import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { useQuery } from "@tanstack/react-query";
import { Market, useMarket } from "../useMarket";
import { useTokenInfo } from "../useTokenInfo";
import { getOutcomeTokensOddChart } from "./utils";

export const useOddChartData = (chainId: SupportedChain, market: Market, dayCount: number, intervalSeconds: number) => {
  const { data: parentMarket } = useMarket(market.parentMarket, chainId);
  const { data: parentCollateral } = useTokenInfo(parentMarket?.wrappedTokens?.[Number(market.parentOutcome)], chainId);
  const collateralToken = parentCollateral || COLLATERAL_TOKENS[chainId].primary;
  const outcomeTokens = market.wrappedTokens.map((token, index) => ({
    tokenId: token,
    outcomeName: market.outcomes[index],
  }));
  const marketBlockTimestamp = market.blockTimestamp;
  return useQuery<
    | {
        chartData: {
          name: string;
          type: string;
          data: number[][];
        }[];
        timestamps: number[];
      }
    | undefined,
    Error
  >({
    enabled: !!market,
    gcTime: 1000 * 60 * 60 * 24, //24 hours
    staleTime: 0,
    queryKey: ["useOddChartData", chainId, outcomeTokens, collateralToken, dayCount, intervalSeconds],
    retry: false,
    queryFn: async () =>
      getOutcomeTokensOddChart(
        chainId,
        outcomeTokens,
        collateralToken,
        dayCount,
        intervalSeconds,
        marketBlockTimestamp,
      ),
  });
};
