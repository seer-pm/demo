import { type SupportedChain, isOpStack } from "@seer-pm/sdk/chains";
import { getMarketPoolsPairs } from "@seer-pm/sdk/market-pools";
import type { Market } from "@seer-pm/sdk/market-types";
import type { Address } from "viem";
import { gnosis } from "viem/chains";
import { getAllLiquidityEvents, getLiquidityPositionsAtTimestamp } from "./airdropCalculation/getLiquidityBalances";
import { getAmountsForLiquidity, getSqrtRatioAtTickX96 } from "./airdropCalculation/utils";
import { fetchPools } from "./fetchPools";
import type { TokenHolder } from "./token-transactions";

export type MarketLiquidityHolders = {
  holders: Record<string, TokenHolder[]>;
  poolAddresses: string[];
};

/** Outcome-token amounts backed by LP positions, as `token -> owner -> amount`, plus the pools seen. */
type LiquidityBalances = {
  balances: Map<string, Map<string, bigint>>;
  poolAddresses: string[];
};

/**
 * Outcome-token amounts every LP position represents at the current pool price.
 *
 * Kept in bigint the whole way and shared by both callers: the market page formats it into sorted
 * `TokenHolder[]`, the portfolio reads one owner's row straight out of it. Handing the portfolio the
 * formatted shape instead would mean parsing back the strings this had as bigint one step earlier.
 */
async function collectLiquidityBalances(markets: Market[], owner?: Address): Promise<LiquidityBalances> {
  if (markets.length === 0) return { balances: new Map(), poolAddresses: [] };
  const chainId = markets[0].chainId as SupportedChain;
  // Bunni and chains without a supported user-position source are intentionally not attributed.
  if (chainId !== gnosis.id && !isOpStack(chainId)) return { balances: new Map(), poolAddresses: [] };

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
  // The same mint/burn -> net-liquidity fold the airdrop runs, not a second copy of it: one
  // definition of what an LP position is, so the two cannot disagree about which events net
  // together. `Infinity` because this side wants the position as it stands now.
  const positions = getLiquidityPositionsAtTimestamp(events, Number.POSITIVE_INFINITY);

  const wrappedTokens = markets.flatMap((market) => market.wrappedTokens);
  const outcomeTokens = new Set(wrappedTokens.map((token) => token.toLowerCase()));
  const balances = new Map<string, Map<string, bigint>>();

  for (const position of positions) {
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
      tokenBalances.set(position.origin, (tokenBalances.get(position.origin) ?? 0n) + amount);
      balances.set(token, tokenBalances);
    }
  }

  return { balances, poolAddresses: [...poolsById.keys()] };
}

/** Derives current outcome-token holdings represented by supported LP positions. */
export async function getLiquidityHolders(markets: Market[], owner?: Address): Promise<MarketLiquidityHolders> {
  const { balances, poolAddresses } = await collectLiquidityBalances(markets, owner);
  const wrappedTokens = markets.flatMap((market) => market.wrappedTokens);

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

  return { holders, poolAddresses };
}

/**
 * Outcome-token amounts `owner` holds through LP positions, keyed by lowercased token id.
 *
 * The portfolio's shape: one owner, one amount per token, already summed. `getLiquidityHolders`
 * answers a different question (who holds this market's tokens) and the portfolio was reconstructing
 * this from it by re-parsing the formatted balance strings.
 */
export async function getOwnerLiquidityBalances(markets: Market[], owner: Address): Promise<Map<string, bigint>> {
  const { balances } = await collectLiquidityBalances(markets, owner);
  const ownerId = owner.toLowerCase();
  const result = new Map<string, bigint>();
  for (const [token, byOwner] of balances) {
    const amount = byOwner.get(ownerId) ?? 0n;
    if (amount > 0n) result.set(token, amount);
  }
  return result;
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
