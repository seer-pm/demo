import { isTwoStringsEqual } from "@/lib/utils";
import type { SupportedChain } from "@seer-pm/sdk";
import { getToken0Token1 } from "@seer-pm/sdk/market-pools";
import type { Address } from "viem";
import { PoolHourData, getAllPoolHourDatas } from "./getPoolHourDatas";

type TokenPair = { tokenId: Address; parentTokenId?: Address; collateralToken: Address };

/**
 * Fetches the full pool-hour price history for the chain once (time-chunked, not per token pair —
 * chains like Optimism have tens of thousands of outcome tokens, so a per-pair fetch does not
 * scale). `computePrices` filters this array in memory, so extra pools are harmless. The result
 * can be reused to compute prices at many timestamps (see backfill), avoiding per-day fetches.
 */
export async function fetchPoolHourDatas(chainId: SupportedChain) {
  return getAllPoolHourDatas(chainId);
}

// `poolHourDatas` is sorted by periodStartUnix desc, so the first entry per pool with
// periodStartUnix <= startTime is the latest price at/ before that time.
function getLatestPoolHourDataMap(poolHourDatas: PoolHourData[], startTime: number) {
  const resolvedMap = new Map<string, PoolHourData>();
  for (const entry of poolHourDatas) {
    const key = entry.pool.token0.id + entry.pool.token1.id;
    if (!resolvedMap.has(key) && Number(entry.periodStartUnix) <= startTime) {
      resolvedMap.set(key, entry);
    }
  }
  return resolvedMap;
}

/**
 * Computes the price (in collateral terms) of each outcome token at `startTime` from a
 * pre-fetched `poolHourDatas` array. Pure — no network — so it is safe to call once per day
 * over the same fetched data.
 */
export function computePrices(poolHourDatas: PoolHourData[], tokens: TokenPair[] | undefined, startTime: number) {
  if (!tokens?.length) return {};
  const latestPoolHourDataMap = getLatestPoolHourDataMap(poolHourDatas, startTime);
  const [simpleTokens, conditionalTokens] = tokens.reduce(
    (acc, curr) => {
      acc[curr.parentTokenId ? 1 : 0].push(curr);
      return acc;
    },
    [[], []] as TokenPair[][],
  );

  const simpleTokensMapping = simpleTokens.reduce(
    (acc, { tokenId, collateralToken }) => {
      const { token0, token1 } = getToken0Token1(tokenId, collateralToken);
      const correctPoolHourData = latestPoolHourDataMap.get(token0 + token1);
      acc[tokenId.toLocaleLowerCase()] = correctPoolHourData
        ? isTwoStringsEqual(tokenId, token0)
          ? Number(correctPoolHourData.token1Price)
          : Number(correctPoolHourData.token0Price)
        : 0;
      return acc;
    },
    {} as { [key: string]: number },
  );

  const conditionalTokensMapping = conditionalTokens.reduce(
    (acc, { tokenId, parentTokenId }) => {
      const { token0, token1 } = getToken0Token1(tokenId, parentTokenId!);
      const correctPoolHourData = latestPoolHourDataMap.get(token0 + token1);
      const relativePrice = correctPoolHourData
        ? isTwoStringsEqual(tokenId, token0)
          ? Number(correctPoolHourData.token1Price)
          : Number(correctPoolHourData.token0Price)
        : 0;

      acc[tokenId.toLocaleLowerCase()] =
        relativePrice * (simpleTokensMapping?.[parentTokenId!.toLocaleLowerCase()] || 0);
      return acc;
    },
    {} as { [key: string]: number },
  );
  return { ...simpleTokensMapping, ...conditionalTokensMapping };
}

/** Convenience: fetch + compute for a single timestamp. */
export async function getPrices(tokens: TokenPair[] | undefined, chainId: SupportedChain, startTime: number) {
  if (!tokens?.length) return {};
  const poolHourDatas = await fetchPoolHourDatas(chainId);
  return computePrices(poolHourDatas, tokens, startTime);
}
