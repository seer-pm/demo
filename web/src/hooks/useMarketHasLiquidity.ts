import { SupportedChain } from "@/lib/chains";
import { bigIntMax } from "@/lib/utils";
import { useAllOutcomePools } from "./useMarketPools";

function useMarketHasLiquidity(chainId: SupportedChain, wrappedAddresses: `0x${string}`[] | undefined) {
  const { data: outcomePools = [] } = useAllOutcomePools(chainId as SupportedChain);
  const outcomeLiquidityMapping = outcomePools.reduce(
    (obj, item) => {
      const outcomeTokenId = item.token0.symbol === "sDAI" ? item.token1.id : item.token0.id;
      obj[outcomeTokenId.toLowerCase()] = BigInt(item.liquidity);
      return obj;
    },
    {} as { [key: string]: bigint },
  );
  return bigIntMax(...(wrappedAddresses?.map((address) => outcomeLiquidityMapping[address.toLowerCase()]) ?? [])) > 0n;
}

export default useMarketHasLiquidity;
