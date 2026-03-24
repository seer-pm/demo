import { type Address, erc20Abi, formatUnits, zeroAddress } from "viem";
import { multicall } from "viem/actions";
import { chainIds, getPublicClientByChainId, gnosis } from "./config.ts";

import { isTwoStringsEqual } from "@/lib/utils.ts";
import type { SupportedChain } from "@seer-pm/sdk";
import { getMarketPoolsPairs, getTokensPairKey } from "@seer-pm/sdk/market-pools";
import type { Token0Token1 } from "@seer-pm/sdk/market-pools";
import type { Market } from "@seer-pm/sdk/market-types";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@seer-pm/sdk/subgraph";
import { OrderDirection, Pool_OrderBy, getSdk as getSwaprSdk } from "@seer-pm/sdk/subgraph/swapr";
import { getSdk as getUniswapSdk } from "@seer-pm/sdk/subgraph/uniswap";
import pLimit from "p-limit";

interface SubgraphPool {
  id: string;
  sqrtPrice: string;
  token0: { id: string; symbol: string; decimals: string };
  token1: { id: string; symbol: string; decimals: string };
  token0Price: string;
  token1Price: string;
  volumeToken0: string;
  volumeToken1: string;
}
export interface Pool extends SubgraphPool {
  balance0: number;
  balance1: number;
  isToken0Collateral: boolean;
  chainId: SupportedChain;
  outcomesCountWithoutInvalid: number;
  market: Market;
}

export async function fetchTokenBalances(
  tokenList: { token: Address; owner: Address }[],
  chainId: SupportedChain,
  groupCount: number,
  retry?: boolean,
) {
  try {
    const client = getPublicClientByChainId(chainId);
    // try to batch call
    let balances: bigint[] = [];
    for (let i = 0; i < Math.ceil(tokenList.length / groupCount); i++) {
      const data = await multicall(client, {
        allowFailure: false,
        contracts: tokenList.slice(i * groupCount, (i + 1) * groupCount).map(({ token, owner }) => ({
          address: token,
          abi: erc20Abi,
          args: [owner],
          functionName: "balanceOf",
        })),
        batchSize: 0,
      });
      balances = balances.concat(data as bigint[]);
      // wait 200 ms to not reach max rate limit
      await new Promise((res) => setTimeout(res, 200));
    }
    return balances;
  } catch (e) {
    if (retry) {
      return await fetchTokenBalances(tokenList, chainId, 8);
    }
    throw e;
  }
}

async function fetchPoolsByTokenPairs(chainId: SupportedChain, tokenPairs: Token0Token1[]) {
  const subgraphClient = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);
  if (!subgraphClient) {
    return [];
  }
  const graphQLSdk = chainId === gnosis.id ? getSwaprSdk : getUniswapSdk;
  const maxAttempts = 20;
  let attempt = 0;
  let id = undefined;
  let total: SubgraphPool[] = [];
  while (attempt < maxAttempts) {
    const { pools }: { pools: SubgraphPool[] } = await graphQLSdk(subgraphClient).GetPools({
      where: {
        and: [
          {
            or: tokenPairs,
          },
          { id_lt: id },
        ],
      },
      first: 1000,
      // biome-ignore lint/suspicious/noExplicitAny:
      orderBy: Pool_OrderBy.Id as any,
      // biome-ignore lint/suspicious/noExplicitAny:
      orderDirection: OrderDirection.Desc as any,
    });
    total = total.concat(pools);
    if (pools[pools.length - 1]?.id === id) {
      break;
    }
    if (pools.length < 1000) {
      break;
    }
    id = pools[pools.length - 1]?.id;
    attempt++;
  }
  return total;
}

export async function fetchPools(chainId: SupportedChain, tokenPairs: Token0Token1[]) {
  const batchSize = 900;
  const limit = pLimit(2);

  const batches = Array.from({ length: Math.ceil(tokenPairs.length / batchSize) }, (_, i) =>
    tokenPairs.slice(i * batchSize, (i + 1) * batchSize),
  );

  const results = await Promise.all(batches.map((batch) => limit(() => fetchPoolsByTokenPairs(chainId, batch))));

  return results.flat();
}

/**
 * For **Swapr** pools (Algebra-style AMM): off-chain counterpart to `pricing.priceToTokenPrices`,
 * spot ratios from sqrtPrice (Q64.96 → Q192 price). Returns the same pair order as this subgraph:
 * [token0Price, token1Price].
 *
 * Useful in clients because the Swapr subgraph only writes `token0Price` / `token1Price` on swap events
 * (and on pool initialize in newer mappings); if no swap has been indexed yet, those fields can
 * stay zero while `sqrtPrice` is already valid — recompute from `sqrtPrice` instead.
 *
 * Pass `sqrtPrice` as bigint (e.g. BigInt(pool.sqrtPrice) from GraphQL string).
 *
 * Each ratio is scaled with 1e18 in bigint before converting to number; the final values are still
 * IEEE doubles (~15–17 significant digits).
 */
export function priceToTokenPricesNumber(sqrtPrice: bigint, decimals0: number, decimals1: number): [number, number] {
  const Q192 = 1n << 192n;
  const RATIO_SCALE = 1_000_000_000_000_000_000n;

  function pow10(n: number): bigint {
    return 10n ** BigInt(n);
  }

  function ratioToNumber(a: bigint, b: bigint): number {
    return b === 0n ? 0 : Number((a * RATIO_SCALE) / b) / 1e18;
  }

  const sqrt2 = sqrtPrice * sqrtPrice;
  const d0 = pow10(decimals0);
  const d1 = pow10(decimals1);

  // token1 per token0: (sqrt²/Q192) * 10^d0/10^d1
  const num1 = sqrt2 * d0;
  const den1 = Q192 * d1;
  const price1 = ratioToNumber(num1, den1);

  // token0 per token1: inverse as a separate ratio — avoids float error from 1/price1
  const num0 = Q192 * d1;
  const den0 = sqrt2 * d0;
  const price0 = ratioToNumber(num0, den0);

  return [price0, price1];
}

/**
 * Subgraph spot prices for the pool. On Swapr (Gnosis), if indexed `token0Price`/`token1Price` are still
 * zero, recompute from `sqrtPrice` (see `priceToTokenPricesNumber`). Other DEXes: pass through.
 */
export function getSubgraphPoolTokenPrices(
  chainId: SupportedChain,
  pool: SubgraphPool,
): { token0Price: string; token1Price: string } {
  if (chainId !== gnosis.id) {
    return { token0Price: pool.token0Price, token1Price: pool.token1Price };
  }
  if (Number(pool.token0Price) === 0 && Number(pool.token1Price) === 0) {
    const [p0, p1] = priceToTokenPricesNumber(
      BigInt(pool.sqrtPrice),
      Number(pool.token0.decimals),
      Number(pool.token1.decimals),
    );
    return { token0Price: String(p0), token1Price: String(p1) };
  }
  return { token0Price: pool.token0Price, token1Price: pool.token1Price };
}

export async function getAllMarketPools(markets: Market[]) {
  const tokenPairToMarketMapping = markets.reduce(
    (acc, curr) => {
      for (const token of curr.wrappedTokens) {
        for (const collateral of [curr.collateralToken, curr.collateralToken1, curr.collateralToken2]) {
          if (!isTwoStringsEqual(collateral, zeroAddress)) {
            acc[collateral > token ? `${token}-${collateral}` : `${collateral}-${token}`] = curr;
          }
        }
      }
      return acc;
    },
    {} as { [key: string]: Market },
  );
  const settled = await Promise.allSettled(
    chainIds.map(async (chainId) => {
      const marketsByChain = markets.filter((market) => market.chainId === chainId);
      const tokenPairsByChain = marketsByChain.flatMap((market) => getMarketPoolsPairs(market));
      const poolsByChain = await fetchPools(chainId, tokenPairsByChain);
      const tokenPoolList = poolsByChain.reduce(
        (acc, curr) => {
          acc.push({
            token: curr.token0.id as Address,
            owner: curr.id as Address,
          });
          acc.push({
            token: curr.token1.id as Address,
            owner: curr.id as Address,
          });
          return acc;
        },
        [] as { token: Address; owner: Address }[],
      );
      const poolTokenBalances = (await fetchTokenBalances(tokenPoolList, chainId, 50, true)) as bigint[];
      const poolTokenBalanceMapping = tokenPoolList.reduce(
        (acc, curr, index) => {
          acc[`${curr.token}-${curr.owner}`] = Number(Number(formatUnits(poolTokenBalances[index], 18)).toFixed(4));
          return acc;
        },
        {} as { [key: string]: number },
      );
      const poolsByChainWithMarketData = poolsByChain.map((pool) => {
        const market = tokenPairToMarketMapping[getTokensPairKey(pool.token0.id, pool.token1.id)];
        if (!market) return;

        const { token0Price, token1Price } = getSubgraphPoolTokenPrices(chainId, pool);

        return {
          ...pool,
          token0Price,
          token1Price,
          market,
          balance0: poolTokenBalanceMapping[`${pool.token0.id}-${pool.id}`],
          balance1: poolTokenBalanceMapping[`${pool.token1.id}-${pool.id}`],
          // For generic markets, isToken0Collateral indicates whether token0 is the market's collateral token.
          // For futarchy markets, this flag is unused since they have two collateral tokens.
          isToken0Collateral: isTwoStringsEqual(pool.token0.id, market.collateralToken),
          chainId: Number(chainId),
          outcomesCountWithoutInvalid: market.wrappedTokens.length - 1,
        };
      });
      return poolsByChainWithMarketData.filter((x) => x);
    }),
  );

  const allPools = settled.flatMap((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    const chainId = chainIds[index];
    console.error(`[getAllMarketPools] chainId ${chainId} failed:`, result.reason);
    return [] as Pool[];
  }) as Pool[];
  return allPools;
}
