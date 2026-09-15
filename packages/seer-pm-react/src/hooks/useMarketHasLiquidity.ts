import { type Market as BaseMarket, FUTARCHY_LP_PAIRS_MAPPING, isInvalidOutcome } from "@seer-pm/sdk";
import { bigIntMax, isTwoStringsEqual, isUndefined } from "../utils";
import { useMarketPools } from "./useMarketPools";

type Market = BaseMarket;

export function useMarketHasLiquidity(market: Market, outcomeIndex?: number | undefined): boolean | undefined {
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
    if (market.type === "Futarchy") {
      return (
        (outcomeLiquidityMapping[market.wrappedTokens[outcomeIndex]] || 0n) > 0n ||
        (outcomeLiquidityMapping[market.wrappedTokens[FUTARCHY_LP_PAIRS_MAPPING[outcomeIndex]]] || 0n) > 0n
      );
    }
    const hasOutcomeLiquidity = (index: number) => (outcomeLiquidityMapping[market.wrappedTokens[index]] || 0n) > 0n;
    // Invalid has no pool of its own: it is bought by minting a set and selling every other
    // outcome (and sold the other way round), so it is liquid when all of them are.
    if (isInvalidOutcome(market, outcomeIndex)) {
      return market.wrappedTokens.slice(0, -1).every((_, index) => hasOutcomeLiquidity(index));
    }
    return hasOutcomeLiquidity(outcomeIndex);
  }
  return (
    bigIntMax(...(market.wrappedTokens.map((address) => outcomeLiquidityMapping[address.toLowerCase()]) ?? [])) > 0n
  );
}

export default useMarketHasLiquidity;
