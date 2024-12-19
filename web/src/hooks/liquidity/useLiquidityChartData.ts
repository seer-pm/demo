import { COLLATERAL_TOKENS } from "@/lib/config";
import { useQuery } from "@tanstack/react-query";
import { Market, useMarket } from "../useMarket";
import { useTokenInfo } from "../useTokenInfo";
import { getLiquidityChart } from "./getLiquidityChart";

export const useLiquidityChartData = (market: Market) => {
  const { data: parentMarket } = useMarket(market.parentMarket.id, market.chainId);
  const { data: parentCollateral } = useTokenInfo(
    parentMarket?.wrappedTokens?.[Number(market.parentOutcome)],
    market.chainId,
  );
  const collateralToken = parentCollateral || COLLATERAL_TOKENS[market.chainId].primary;
  const tokens = market.wrappedTokens.map((outcomeToken) => {
    return outcomeToken.toLocaleLowerCase() > collateralToken.address.toLocaleLowerCase()
      ? [collateralToken.address, outcomeToken]
      : [outcomeToken, collateralToken.address];
  });
  return useQuery<
    (
      | {
          [key: string]: {
            price0List: string[];
            price1List: string[];
            amount0List: number[];
            amount1List: number[];
            amount0NeedList: number[];
            amount1NeedList: number[];
          };
        }
      | undefined
    )[],
    Error
  >({
    queryKey: ["useLiquidityChartData", market.id],
    queryFn: async () => {
      return await Promise.all(tokens.map(([token0, token1]) => getLiquidityChart(market.chainId, token0, token1)));
    },
  });
};
