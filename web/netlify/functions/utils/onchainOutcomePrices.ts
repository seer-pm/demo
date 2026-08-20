import { POOL_FACTORY_ADDRESSES, type SupportedChain, computePoolAddress } from "@seer-pm/sdk";
import { type Token0Token1, getTokensPairKey } from "@seer-pm/sdk/market-pools";
import type { Address } from "viem";
import { multicall } from "viem/actions";
import { getPublicClientByChainId, gnosis } from "./config";
import { fetchPools, priceToTokenPricesNumber } from "./fetchPools";
import { type OutcomePriceToken, type PairMids, mapOutcomePrices, outcomePairs, setPairMid } from "./outcomePrices";
import { getTokenDecimals } from "./tokenDecimals";

/** Algebra keeps the spot price in `globalState`; Uniswap V3 in `slot0`. Only the first field is read. */
const ALGEBRA_POOL_ABI = [
  {
    inputs: [],
    name: "globalState",
    outputs: [
      { name: "price", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "fee", type: "uint16" },
      { name: "timepointIndex", type: "uint16" },
      { name: "communityFeeToken0", type: "uint8" },
      { name: "communityFeeToken1", type: "uint8" },
      { name: "unlocked", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const UNISWAP_V3_POOL_ABI = [
  {
    inputs: [],
    name: "slot0",
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "observationIndex", type: "uint16" },
      { name: "observationCardinality", type: "uint16" },
      { name: "observationCardinalityNext", type: "uint16" },
      { name: "feeProtocol", type: "uint8" },
      { name: "unlocked", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

type PairPool = { pair: Token0Token1; poolAddress: Address };

/** Algebra pools are CREATE2 from the token pair alone, so the address needs no lookup. */
function algebraPairPools(chainId: SupportedChain, pairs: Token0Token1[]): PairPool[] {
  const factoryAddress = POOL_FACTORY_ADDRESSES[chainId];
  if (!factoryAddress) {
    return [];
  }
  return pairs.map((pair) => ({
    pair,
    poolAddress: computePoolAddress({ factoryAddress, tokenA: pair.token0, tokenB: pair.token1 }),
  }));
}

/** Uniswap V3 pool addresses depend on the fee tier, so take the deepest pool indexed for each pair. */
async function uniswapPairPools(chainId: SupportedChain, pairs: Token0Token1[]): Promise<PairPool[]> {
  const pools = await fetchPools(chainId, pairs);
  const deepestByPair = new Map<string, { poolAddress: Address; liquidity: bigint }>();

  for (const pool of pools) {
    const key = getTokensPairKey(pool.token0.id, pool.token1.id);
    const liquidity = BigInt(pool.liquidity ?? 0);
    const current = deepestByPair.get(key);
    if (!current || liquidity > current.liquidity) {
      deepestByPair.set(key, { poolAddress: pool.id as Address, liquidity });
    }
  }

  return pairs.reduce((acc, pair) => {
    const deepest = deepestByPair.get(getTokensPairKey(pair.token0, pair.token1));
    if (deepest) {
      acc.push({ pair, poolAddress: deepest.poolAddress });
    }
    return acc;
  }, [] as PairPool[]);
}

async function fetchPairMidsOnChain(chainId: SupportedChain, pairs: Token0Token1[]): Promise<PairMids> {
  const mids: PairMids = new Map();
  const isAlgebra = chainId === gnosis.id;

  const pairPools = isAlgebra ? algebraPairPools(chainId, pairs) : await uniswapPairPools(chainId, pairs);
  if (pairPools.length === 0) {
    return mids;
  }

  const results = await multicall(getPublicClientByChainId(chainId), {
    allowFailure: true,
    contracts: pairPools.map(({ poolAddress }) =>
      isAlgebra
        ? ({ address: poolAddress, abi: ALGEBRA_POOL_ABI, functionName: "globalState" } as const)
        : ({ address: poolAddress, abi: UNISWAP_V3_POOL_ABI, functionName: "slot0" } as const),
    ),
  });

  const decimals = getTokenDecimals(
    chainId,
    pairs.flatMap((pair) => [pair.token0, pair.token1]),
  );

  // Per-call `failure` (allowFailure: true) is "no contract / revert" — Algebra CREATE2 addresses
  // are computed without checking deployment, so every pool can fail when none exist. Price 0.
  // A dead RPC throws from `multicall` itself; that still fail-closes the caller.
  const unreadable = results.filter((result) => result.status === "failure").length;
  if (unreadable > 0) {
    console.warn(`getCurrentOutcomePrices chain=${chainId} unreadable pools ${unreadable}/${pairPools.length}`);
  }

  results.forEach((result, index) => {
    if (result.status === "failure") {
      return;
    }
    const sqrtPriceX96 = result.result[0];
    if (!sqrtPriceX96) {
      return;
    }
    const { token0, token1 } = pairPools[index].pair;
    const [token0PerToken1, token1PerToken0] = priceToTokenPricesNumber(
      sqrtPriceX96,
      decimals[token0.toLowerCase()] ?? 18,
      decimals[token1.toLowerCase()] ?? 18,
    );
    setPairMid(mids, token0, token1, { token0PerToken1, token1PerToken0 });
  });

  return mids;
}

/**
 * Current price of each outcome token, read from the pool at request time.
 *
 * Indexed hour candles are only written when a pool trades, so a quiet pool can be months behind
 * the market — fine for history, wrong for "now". Pools that cannot be read (never deployed, revert)
 * leave that outcome at 0 rather than falling back to a stale candle. A dead RPC still throws
 * because `multicall` itself fails.
 */
export async function getCurrentOutcomePrices(
  tokens: OutcomePriceToken[],
  chainId: SupportedChain,
): Promise<Record<string, number>> {
  const pairs = outcomePairs(tokens);
  if (pairs.length === 0) {
    return {};
  }

  const mids = await fetchPairMidsOnChain(chainId, pairs);
  return mapOutcomePrices(tokens, mids);
}
