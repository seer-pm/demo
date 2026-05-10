import {
  type Market,
  POOL_FACTORY_ADDRESSES,
  UNISWAP_V3_POOL_INIT_CODE_HASH,
  computePoolAddress,
  getComputedPoolAddressesForMarket,
} from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";

export {
  POOL_FACTORY_ADDRESSES,
  UNISWAP_V3_POOL_INIT_CODE_HASH,
  computePoolAddress,
  getComputedPoolAddressesForMarket,
};

export const useComputedPoolAddresses = (market: Market) => {
  return useQuery<Address[], Error>({
    queryKey: ["useComputedPoolAddresses", market.id, market.chainId],
    enabled: !!market,
    queryFn: () => Promise.resolve(getComputedPoolAddressesForMarket(market)),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};
