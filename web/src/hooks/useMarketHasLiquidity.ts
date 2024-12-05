import { getUniqueCollaterals } from "@/lib/market";
import { bigIntMax, isTwoStringsEqual } from "@/lib/utils";
import { Market } from "./useMarket";
import { useAllOutcomePools } from "./useMarketPools";

function useMarketHasLiquidity(market: Market) {
  const { data: outcomePools = [] } = useAllOutcomePools(market);
  const outcomeLiquidityMapping = outcomePools.reduce(
    (obj, item) => {
      const outcomeTokenId = getUniqueCollaterals(market).some((collateralToken) =>
        isTwoStringsEqual(item.token0.id, collateralToken),
      )
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
  return (
    bigIntMax(...(market.wrappedTokens.map((address) => outcomeLiquidityMapping[address.toLowerCase()]) ?? [])) > 0n
  );
}

export default useMarketHasLiquidity;
