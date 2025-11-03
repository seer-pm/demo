import { SupportedChain } from "@/lib/chains";
import { Market, getMarketPoolsPairs } from "@/lib/market";
import { useQuery } from "@tanstack/react-query";
import { Address, encodeAbiParameters, getCreate2Address, keccak256 } from "viem";

// same init hash for uniswap and algebra
const UNISWAP_V3_POOL_INIT_CODE_HASH = "0xbce37a54eab2fcd71913a0d40723e04238970e7fc1159bfd58ad5b79531697e7";

const FACTORY_ADDRESSES: Partial<Record<SupportedChain, Address>> = {
  // algebra deployer
  100: "0xC1b576AC6Ec749d5Ace1787bF9Ec6340908ddB47",
  // TODO: add uniswap deployers
};

/**
 * Computes a pool address
 * @param factoryAddress The Uniswap V3 factory address
 * @param tokenA The first token of the pair, irrespective of sort order
 * @param tokenB The second token of the pair, irrespective of sort order
 * @param fee The fee tier of the pool
 * @returns The pool address
 */
export function computePoolAddress({
  factoryAddress,
  tokenA,
  tokenB,
  initCodeHashManualOverride,
}: {
  factoryAddress: Address;
  tokenA: Address;
  tokenB: Address;
  initCodeHashManualOverride?: string;
}): Address {
  // Sort tokens by address (token0 < token1)
  const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];

  // Encode the token addresses using viem's encodeAbiParameters
  const salt = keccak256(encodeAbiParameters([{ type: "address" }, { type: "address" }], [token0, token1]));

  return getCreate2Address({
    from: factoryAddress,
    salt,
    bytecodeHash: (initCodeHashManualOverride ?? UNISWAP_V3_POOL_INIT_CODE_HASH) as `0x${string}`,
  });
}

export const useComputedPoolAddresses = (market: Market) => {
  return useQuery<Address[], Error>({
    queryKey: ["useComputedPoolAddresses", market.id, market.chainId],
    enabled: !!market,
    queryFn: async () => {
      const pairs = getMarketPoolsPairs(market);

      if (pairs.length === 0) {
        return [];
      }

      // Get factory address for the chain
      const factoryAddress = FACTORY_ADDRESSES[market.chainId];
      if (!factoryAddress) {
        console.error(`Factory address not configured for chain ${market.chainId}`);
        return [];
      }

      const computedAddresses: Address[] = [];

      for (const pair of pairs) {
        try {
          const poolAddress = computePoolAddress({
            factoryAddress,
            tokenA: pair.token0,
            tokenB: pair.token1,
          });

          computedAddresses.push(poolAddress);
        } catch (error) {
          console.error(`Error computing pool address for pair ${pair.token0}-${pair.token1}:`, error);
        }
      }

      return computedAddresses;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};
