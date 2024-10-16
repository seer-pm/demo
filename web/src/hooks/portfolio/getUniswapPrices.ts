import { SupportedChain } from "@/lib/chains";
import { uniswapGraphQLClient } from "@/lib/subgraph";
import { getSdk } from "../queries/gql-generated-uniswap";
import { getBlockNumberAtTime, getTokenPricesMapping } from "./utils";

export async function getUniswapHistoryTokensPrices(
  tokens: { tokenId: string; parentTokenId?: string }[] | undefined,
  chainId: SupportedChain,
  startTime: number,
) {
  if (!tokens) return {};
  const subgraphClient = uniswapGraphQLClient(chainId);
  if (!subgraphClient) {
    throw new Error("Subgraph not available");
  }
  const blockNumber = await getBlockNumberAtTime(startTime);
  const { pools } = await getSdk(subgraphClient).GetPools({
    where: {
      or: tokens.reduce(
        (acc, { tokenId }) => {
          acc.push({ token0: tokenId.toLocaleLowerCase() }, { token1: tokenId.toLocaleLowerCase() });
          return acc;
        },
        [] as { [key: string]: string }[],
      ),
    },
    block: {
      number: blockNumber,
    },
  });

  return getTokenPricesMapping(tokens, pools, chainId);
}

export async function getUniswapCurrentTokensPrices(
  tokens: { tokenId: string; parentTokenId?: string }[] | undefined,
  chainId: SupportedChain,
) {
  if (!tokens) return {};
  const subgraphClient = uniswapGraphQLClient(chainId);
  if (!subgraphClient) {
    throw new Error("Subgraph not available");
  }

  const { pools } = await getSdk(subgraphClient).GetPools({
    where: {
      or: tokens.reduce(
        (acc, { tokenId }) => {
          acc.push({ token0: tokenId.toLocaleLowerCase() }, { token1: tokenId.toLocaleLowerCase() });
          return acc;
        },
        [] as { [key: string]: string }[],
      ),
    },
  });

  return getTokenPricesMapping(tokens, pools, chainId);
}

export async function getUniswapPools(
  tokens: { tokenId: string; parentTokenId?: string }[] | undefined,
  chainId: SupportedChain,
) {
  if (!tokens) return [];
  const subgraphClient = uniswapGraphQLClient(chainId);
  if (!subgraphClient) {
    throw new Error("Subgraph not available");
  }

  const { pools } = await getSdk(subgraphClient).GetPools({
    where: {
      or: tokens.reduce(
        (acc, { tokenId }) => {
          acc.push({ token0: tokenId.toLocaleLowerCase() }, { token1: tokenId.toLocaleLowerCase() });
          return acc;
        },
        [] as { [key: string]: string }[],
      ),
    },
  });

  return pools;
}
