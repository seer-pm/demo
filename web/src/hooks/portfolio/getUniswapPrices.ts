import { SupportedChain } from "@/lib/chains";
import { uniswapGraphQLClient } from "@/lib/subgraph";
import { ethers } from "ethers";
import { getSdk } from "../queries/gql-generated-uniswap";
import { getTokenPricesMapping } from "./utils";

async function getBlockNumberAtTime(timestamp: number) {
  // Connect to an Ethereum node (replace with your own provider URL)
  const provider = new ethers.providers.Web3Provider(window.ethereum);

  // Get the latest block
  const latestBlock = await provider.getBlock("latest");

  // Binary search to find the block closest to the target timestamp
  let left = 1;
  let right = latestBlock.number;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const block = await provider.getBlock(mid);

    if (block.timestamp === timestamp) {
      return block.number;
    }
    if (block.timestamp < timestamp) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  // Return the closest block number
  return right;
}

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
