import { COLLATERAL_TOKENS } from "@/lib/config";
import { isTwoStringsEqual } from "@/lib/utils";
import { ChainId } from "@swapr/sdk";
import { ethers } from "ethers";

export function getTokenPricesMapping(
  tokens: { tokenId: string; parentTokenId?: string }[],
  pools: { token0: { id: string }; token1: { id: string }; token0Price: string; token1Price: string }[],
  chainId: ChainId,
) {
  const [simpleTokens, conditionalTokens] = tokens.reduce(
    (acc, curr) => {
      acc[curr.parentTokenId ? 1 : 0].push(curr);
      return acc;
    },
    [[], []] as {
      tokenId: string;
      parentTokenId?: string;
    }[][],
  );

  const simpleTokensMapping = simpleTokens.reduce(
    (acc, { tokenId }) => {
      let isTokenPrice0 = true;
      const correctPool = pools.find((pool) => {
        const sDAIAddress = COLLATERAL_TOKENS[chainId].primary.address;
        if (sDAIAddress > tokenId.toLocaleLowerCase()) {
          isTokenPrice0 = false;
          return isTwoStringsEqual(pool.token0.id, tokenId) && isTwoStringsEqual(pool.token1.id, sDAIAddress);
        }
        return isTwoStringsEqual(pool.token1.id, tokenId) && isTwoStringsEqual(pool.token0.id, sDAIAddress);
      });

      acc[tokenId.toLocaleLowerCase()] = correctPool
        ? isTokenPrice0
          ? Number(correctPool.token0Price)
          : Number(correctPool.token1Price)
        : 0;
      return acc;
    },
    {} as { [key: string]: number },
  );

  const conditionalTokensMapping = conditionalTokens.reduce(
    (acc, { tokenId, parentTokenId }) => {
      let isTokenPrice0 = true;
      const correctPool = pools.find((pool) => {
        if (parentTokenId!.toLocaleLowerCase() > tokenId.toLocaleLowerCase()) {
          isTokenPrice0 = false;
          return isTwoStringsEqual(pool.token0.id, tokenId) && isTwoStringsEqual(pool.token1.id, parentTokenId);
        }
        return isTwoStringsEqual(pool.token1.id, tokenId) && isTwoStringsEqual(pool.token0.id, parentTokenId);
      });

      const relativePrice = correctPool
        ? isTokenPrice0
          ? Number(correctPool.token0Price)
          : Number(correctPool.token1Price)
        : 0;
      acc[tokenId.toLocaleLowerCase()] = relativePrice * simpleTokensMapping[parentTokenId!.toLocaleLowerCase()];
      return acc;
    },
    {} as { [key: string]: number },
  );

  return { ...simpleTokensMapping, ...conditionalTokensMapping };
}

export async function getBlockNumberAtTime(timestamp: number) {
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