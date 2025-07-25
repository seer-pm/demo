import { GetPoolHourDatasQuery } from "@/hooks/queries/gql-generated-swapr";
import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { getToken0Token1 } from "@/lib/market";
import { isTwoStringsEqual } from "@/lib/utils";
import { Address } from "viem";
import { getPoolHourDatasByTokenPairs } from "./getPoolHourDatas";

async function getLatestPoolHourDataMap(
  tokens: { tokenId: Address; parentTokenId?: Address; collateralToken: Address }[],
  chainId: SupportedChain,
  startTime: number,
) {
  const resolvedMap = new Map<string, GetPoolHourDatasQuery["poolHourDatas"][0]>();
  const poolHourDatas = await getPoolHourDatasByTokenPairs(chainId, tokens);
  for (const entry of poolHourDatas) {
    const key = entry.pool.token0.id + entry.pool.token1.id;
    if (!resolvedMap.has(key) && Number(entry.periodStartUnix) <= startTime) {
      // since we sorted poolHourDatas by periodStartUnix desc already
      resolvedMap.set(key, entry);
    }
  }
  return resolvedMap;
}

export async function getPrices(
  tokens: { tokenId: Address; parentTokenId?: Address; collateralToken: Address }[] | undefined,
  chainId: SupportedChain,
  startTime: number,
) {
  if (!tokens?.length) return {};
  const latestPoolHourDataMap = await getLatestPoolHourDataMap(tokens, chainId, startTime);
  const [simpleTokens, conditionalTokens] = tokens.reduce(
    (acc, curr) => {
      acc[curr.parentTokenId ? 1 : 0].push(curr);
      return acc;
    },
    [[], []] as {
      tokenId: Address;
      parentTokenId?: Address;
      collateralToken: Address;
    }[][],
  );

  const simpleTokensMapping = simpleTokens.reduce(
    (acc, { tokenId }) => {
      const sDAIAddress = COLLATERAL_TOKENS[chainId].primary.address;
      const { token0, token1 } = getToken0Token1(tokenId, sDAIAddress);
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
