import type { Address } from "viem";
import { OrderDirection, Pool_OrderBy, getSdk as getSwaprSdk } from "../../generated/subgraph/swapr";
import { getSdk as getUniswapSdk } from "../../generated/subgraph/uniswap";
import type { Token0Token1 } from "../market-pools";
import { swaprGraphQLClient, uniswapGraphQLClient } from "./app-subgraph";
import { CHAIN_IDS } from "./subgraph-endpoints";

export type SubgraphPoolState = {
  token0: Address;
  token1: Address;
  liquidity: bigint;
  /** Null until the pool has its first swap indexed. */
  tick: number | null;
};

/**
 * Current state of every pool of the given pairs, deepest first, in one request. One query per market
 * rather than one per pair: a market with dozens of outcomes would otherwise fan out as many requests
 * and trip the gateway's rate limit.
 */
export async function getPoolsStateFromSubgraph(pairs: Token0Token1[], chainId: number): Promise<SubgraphPoolState[]> {
  if (pairs.length === 0) {
    return [];
  }
  const subgraphClient =
    chainId === CHAIN_IDS.gnosis ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);
  if (!subgraphClient) {
    return [];
  }

  const graphQLSdk = chainId === CHAIN_IDS.gnosis ? getSwaprSdk(subgraphClient) : getUniswapSdk(subgraphClient);
  const { pools } = await graphQLSdk.GetPools({
    where: { or: pairs.map(({ token0, token1 }) => ({ token0, token1 })) },
    // biome-ignore lint/suspicious/noExplicitAny: generated enum cast
    orderBy: Pool_OrderBy.Liquidity as any,
    // biome-ignore lint/suspicious/noExplicitAny: generated enum cast
    orderDirection: OrderDirection.Desc as any,
    first: 1000,
  });

  return pools.map((pool) => ({
    token0: pool.token0.id.toLowerCase() as Address,
    token1: pool.token1.id.toLowerCase() as Address,
    liquidity: BigInt(pool.liquidity),
    tick: pool.tick === null || pool.tick === undefined ? null : Number(pool.tick),
  }));
}
