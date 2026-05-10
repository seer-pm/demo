import type { Address } from "viem";
import { encodeAbiParameters, getCreate2Address, keccak256 } from "viem";
import { getMarketPoolsPairs } from "./market-pools";
import type { Market } from "./market-types";

/** Same init code hash for Uniswap V3 and Algebra pools. */
export const UNISWAP_V3_POOL_INIT_CODE_HASH = "0xbce37a54eab2fcd71913a0d40723e04238970e7fc1159bfd58ad5b79531697e7";

/** Algebra / Uniswap V3 factory by chain (extend when adding chains). */
export const POOL_FACTORY_ADDRESSES: Partial<Record<number, Address>> = {
  100: "0xC1b576AC6Ec749d5Ace1787bF9Ec6340908ddB47",
};

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
  const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];

  const salt = keccak256(encodeAbiParameters([{ type: "address" }, { type: "address" }], [token0, token1]));

  return getCreate2Address({
    from: factoryAddress,
    salt,
    bytecodeHash: (initCodeHashManualOverride ?? UNISWAP_V3_POOL_INIT_CODE_HASH) as `0x${string}`,
  });
}

/** CREATE2 pool addresses for each outcome–counterparty pair in this market (lowercase). */
export function getComputedPoolAddressesForMarket(market: Market): Address[] {
  const pairs = getMarketPoolsPairs(market);
  if (pairs.length === 0) {
    return [];
  }

  const factoryAddress = POOL_FACTORY_ADDRESSES[market.chainId];
  if (!factoryAddress) {
    return [];
  }

  const out: Address[] = [];
  for (const pair of pairs) {
    try {
      const poolAddress = computePoolAddress({
        factoryAddress,
        tokenA: pair.token0,
        tokenB: pair.token1,
      });
      out.push(poolAddress.toLowerCase() as Address);
    } catch {
      // skip invalid pair
    }
  }
  return out;
}
