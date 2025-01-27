import { bigIntMax, isTwoStringsEqual, isUndefined } from "@/lib/utils";
import { Market } from "./useMarket";
import { useAllOutcomePools } from "./useMarketPools";

function useMarketHasLiquidity(market: Market, outcomeIndex?: number | undefined): boolean | undefined {
  const { data: outcomePools = [], isPending } = useAllOutcomePools(market.chainId, market.collateralToken);

  if (isPending) {
    return;
  }

  const outcomeLiquidityMapping = outcomePools.reduce(
    (obj, item) => {
      const outcomeTokenId = isTwoStringsEqual(item.token0.id, market.collateralToken)
        ? item.token1.id
        : item.token0.id;
      obj[outcomeTokenId.toLowerCase()] =
        obj[outcomeTokenId.toLowerCase()] > BigInt(item.liquidity)
          ? obj[outcomeTokenId.toLowerCase()]
          : BigInt(item.liquidity);
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
