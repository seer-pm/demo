import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { useQuery } from "@tanstack/react-query";
import { Market, useMarket } from "../useMarket";
import { useTokenInfo } from "../useTokenInfo";
import { getOddChart } from "./getOddChart";

export const useOddChartData = (chainId: SupportedChain, market: Market, dayCount: number, intervalSeconds: number) => {
  const { data: parentMarket } = useMarket(market.parentMarket, chainId);
  const { data: parentCollateral } = useTokenInfo(parentMarket?.wrappedTokens?.[Number(market.parentOutcome)], chainId);
  const collateralToken = parentCollateral || COLLATERAL_TOKENS[chainId].primary;

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
    queryKey: ["useOddChartData", chainId, market.id, collateralToken, dayCount, intervalSeconds],
    retry: false,
    queryFn: async () => getOddChart(chainId, market, collateralToken, dayCount, intervalSeconds),
  });
};
