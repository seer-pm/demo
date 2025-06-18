import { Market } from "@/lib/market";
import { bigIntMax, isTwoStringsEqual, isUndefined } from "@/lib/utils";
import { useMarketPools } from "./useMarketPools";

function useMarketHasLiquidity(market: Market, outcomeIndex?: number | undefined): boolean | undefined {
  const { data: outcomePools = [], isPending } = useMarketPools(market);

  if (isPending) {
    return;
  }

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

  if (!isUndefined(outcomeIndex)) {
    return (outcomeLiquidityMapping[market.wrappedTokens[outcomeIndex]] || 0n) > 0n;
  }
  return (
    bigIntMax(...(market.wrappedTokens.map((address) => outcomeLiquidityMapping[address.toLowerCase()]) ?? [])) > 0n
  );
}

export default useMarketHasLiquidity;
