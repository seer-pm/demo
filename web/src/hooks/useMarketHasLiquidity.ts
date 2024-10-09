import { SupportedChain } from "@/lib/chains";
import { Token } from "@/lib/tokens";
import { bigIntMax, isTwoStringsEqual } from "@/lib/utils";
import { useAllOutcomePools } from "./useMarketPools";

function useMarketHasLiquidity(chainId: SupportedChain, wrappedAddresses: `0x${string}`[], collateralToken: Token) {
  const { data: outcomePools = [] } = useAllOutcomePools(chainId as SupportedChain, collateralToken);
  const outcomeLiquidityMapping = outcomePools.reduce(
    (obj, item) => {
      const outcomeTokenId = isTwoStringsEqual(item.token0.id, collateralToken.address)
        ? item.token1.id
        : item.token0.id;
      obj[outcomeTokenId.toLowerCase()] = BigInt(item.liquidity);
      return obj;
    },
    {} as { [key: string]: bigint },
  );
  return bigIntMax(...(wrappedAddresses?.map((address) => outcomeLiquidityMapping[address.toLowerCase()]) ?? [])) > 0n;
}

export default useMarketHasLiquidity;
