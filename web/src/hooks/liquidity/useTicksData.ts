import { COLLATERAL_TOKENS } from "@/lib/config";
import { useQuery } from "@tanstack/react-query";
import { Market, useMarket } from "../useMarket";
import { useTokenInfo } from "../useTokenInfo";
import { getTicksData } from "./getTicksData";

export const useTicksData = (market: Market, outcomeTokenIndex: number) => {
  const { data: parentMarket } = useMarket(market.parentMarket.id, market.chainId);
  const { data: parentCollateral } = useTokenInfo(
    parentMarket?.wrappedTokens?.[Number(market.parentOutcome)],
    market.chainId,
  );
  const collateralToken = parentCollateral || COLLATERAL_TOKENS[market.chainId].primary;
  const outcomeToken = market.wrappedTokens[outcomeTokenIndex];
  const tokens =
    outcomeToken.toLocaleLowerCase() > collateralToken.address.toLocaleLowerCase()
      ? [collateralToken.address, outcomeToken]
      : [outcomeToken, collateralToken.address];
  return useQuery<
    | {
        [key: string]: {
          tickIdx: string;
          liquidityNet: string;
        }[];
      }
    | undefined,
    Error
  >({
    queryKey: ["useTicksData", market.id, outcomeTokenIndex],
    queryFn: async () => {
      return await getTicksData(market.chainId, tokens[0], tokens[1]);
    },
  });
};
