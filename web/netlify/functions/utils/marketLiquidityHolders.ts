import { type SupportedChain, isOpStack } from "@seer-pm/sdk/chains";
import { getMarketPoolsPairs } from "@seer-pm/sdk/market-pools";
import type { Market } from "@seer-pm/sdk/market-types";
import type { Address } from "viem";
import { zeroAddress } from "viem";
import { gnosis } from "viem/chains";
import { getAllLiquidityEvents } from "./airdropCalculation/getLiquidityBalances";
import { getAmountsForLiquidity, getSqrtRatioAtTickX96 } from "./airdropCalculation/utils";
import { fetchPools } from "./fetchPools";
import type { TokenHolder } from "./token-transactions";

type LiquidityPosition = {
  owner: Address;
  poolId: string;
  token0: string;
  token1: string;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
};

export type MarketLiquidityHolders = {
  holders: Record<string, TokenHolder[]>;
  poolAddresses: string[];
};

/** Derives current outcome-token holdings represented by supported LP positions. */
export async function getLiquidityHolders(markets: Market[], owner?: Address): Promise<MarketLiquidityHolders> {
  if (markets.length === 0) return { holders: {}, poolAddresses: [] };
  const chainId = markets[0].chainId as SupportedChain;
  // Bunni and chains without a supported user-position source are intentionally not attributed.
  if (chainId !== gnosis.id && !isOpStack(chainId)) return { holders: {}, poolAddresses: [] };

  const pairs = markets.flatMap(getMarketPoolsPairs);
  const [events, pools] = await Promise.all([
    getAllLiquidityEvents(
      chainId,
      pairs.map(({ token0, token1 }) => ({ tokenId: token0, collateralToken: token1 })),
      owner,
    ),
    fetchPools(chainId, pairs),
  ]);
  const poolsById = new Map(pools.map((pool) => [pool.id.toLowerCase(), pool]));
  const positions = new Map<string, LiquidityPosition>();

  for (const event of events) {
    if (event.origin.toLowerCase() === zeroAddress) continue;
    const poolId = event.pool.id.toLowerCase();
    const key = `${poolId}-${event.tickLower}-${event.tickUpper}-${event.origin.toLowerCase()}`;
    const position = positions.get(key) ?? {
      owner: event.origin.toLowerCase() as Address,
      poolId,
      token0: event.token0.id.toLowerCase(),
      token1: event.token1.id.toLowerCase(),
      tickLower: Number(event.tickLower),
      tickUpper: Number(event.tickUpper),
      liquidity: 0n,
    };
    position.liquidity += event.type === "mint" ? BigInt(event.amount) : -BigInt(event.amount);
    positions.set(key, position);
  }

  const wrappedTokens = markets.flatMap((market) => market.wrappedTokens);
  const outcomeTokens = new Set(wrappedTokens.map((token) => token.toLowerCase()));
  const balances = new Map<string, Map<string, bigint>>();

  for (const position of positions.values()) {
    if (position.liquidity <= 0n) continue;
    const pool = poolsById.get(position.poolId);
    if (!pool || BigInt(pool.sqrtPrice) <= 0n) continue;
    // Source: Uniswap v3-periphery LiquidityAmounts.getAmountsForLiquidity; Algebra uses the same geometry.
    // https://github.com/Uniswap/v3-periphery/blob/main/contracts/libraries/LiquidityAmounts.sol
    const { amount0, amount1 } = getAmountsForLiquidity(
      BigInt(pool.sqrtPrice),
      getSqrtRatioAtTickX96(position.tickLower),
      getSqrtRatioAtTickX96(position.tickUpper),
      position.liquidity,
    );

    for (const [token, amount] of [
      [position.token0, amount0],
      [position.token1, amount1],
    ] as const) {
      if (!outcomeTokens.has(token) || amount <= 0n) continue;
      const tokenBalances = balances.get(token) ?? new Map<string, bigint>();
      tokenBalances.set(position.owner, (tokenBalances.get(position.owner) ?? 0n) + amount);
      balances.set(token, tokenBalances);
    }
  }

  const holders = Object.fromEntries(
    wrappedTokens.map((token) => {
      const tokenId = token.toLowerCase();
      const tokenBalances = balances.get(tokenId) ?? new Map<string, bigint>();
      return [
        tokenId,
        [...tokenBalances.entries()]
          .map(([address, balance]) => ({ address: address as Address, balance: balance.toString() }))
          .sort((a, b) => {
            const difference = BigInt(b.balance) - BigInt(a.balance);
            return difference === 0n ? 0 : difference > 0n ? 1 : -1;
          }),
      ];
    }),
  );

  return { holders, poolAddresses: [...poolsById.keys()] };
}

/** Combines direct and LP-backed token balances while excluding pool contracts. */
export function mergeTokenHolders(
  direct: Record<string, TokenHolder[]>,
  liquidity: Record<string, TokenHolder[]>,
  poolAddresses: string[],
): Record<string, TokenHolder[]> {
  const tokens = new Set([...Object.keys(direct), ...Object.keys(liquidity)]);
  const pools = new Set(poolAddresses.map((address) => address.toLowerCase()));
  const merged: Record<string, TokenHolder[]> = {};

  for (const token of tokens) {
    const balances = new Map<string, bigint>();
    for (const holder of [...(direct[token] ?? []), ...(liquidity[token] ?? [])]) {
      const address = holder.address.toLowerCase();
      if (pools.has(address)) continue;
      balances.set(address, (balances.get(address) ?? 0n) + BigInt(holder.balance));
    }
    merged[token] = [...balances.entries()]
      .filter(([, balance]) => balance > 0n)
      .map(([address, balance]) => ({ address: address as Address, balance: balance.toString() }))
      .sort((a, b) => {
        const difference = BigInt(b.balance) - BigInt(a.balance);
        return difference === 0n ? 0 : difference > 0n ? 1 : -1;
      });
  }

  return merged;
}
