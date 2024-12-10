import { bigIntMax, isTwoStringsEqual } from "@/lib/utils";
import { Market } from "./useMarket";
import { useMarketPools } from "./useMarketPools";

function useMarketHasLiquidity(market: Market) {
  const { data: outcomePools = [] } = useMarketPools(market);

  const outcomeLiquidityMapping = outcomePools.flat().reduce(
    (obj, item) => {
      const outcomeTokenId = (
        market.wrappedTokens.some((outcomeToken) => isTwoStringsEqual(item.token0, outcomeToken))
          ? item.token0
          : item.token1
      ).toLowerCase();
      obj[outcomeTokenId] = obj[outcomeTokenId] > BigInt(item.liquidity) ? obj[outcomeTokenId] : BigInt(item.liquidity);
      return obj;
    },
    {} as { [key: string]: bigint },
  );
  return (
    bigIntMax(...(market.wrappedTokens.map((address) => outcomeLiquidityMapping[address.toLowerCase()]) ?? [])) > 0n
  );
}

export default useMarketHasLiquidity;
