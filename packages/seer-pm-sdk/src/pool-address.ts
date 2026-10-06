import type { Address } from "viem";
import { encodeAbiParameters, getCreate2Address, keccak256 } from "viem";
import { getMarketAllPoolsPairs } from "./market-pools";
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

/**
 * CREATE2 pool addresses for every pair an outcome of this market can trade in (lowercase).
 *
 * Every pair, not one per outcome: a child market's outcome may be pooled against the chain's main
 * collateral rather than the parent outcome token it is collateralized with, and the callers use this
 * as the set that tells a trade from a wallet transfer and a pool reserve from a holder. A pair left
 * out here is a pool whose trades read as nothing and whose reserves read as a holder.
 */
export function getComputedPoolAddressesForMarket(market: Market): Address[] {
  const pairs = getMarketAllPoolsPairs(market);
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
