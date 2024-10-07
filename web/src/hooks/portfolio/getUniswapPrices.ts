import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { uniswapGraphQLClient } from "@/lib/subgraph";
import { isTwoStringsEqual } from "@/lib/utils";
import { ethers } from "ethers";
import { getSdk } from "../queries/gql-generated-uniswap";

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
  tokens: string[] | undefined,
  chainId: SupportedChain,
  startTime: number,
) {
  if (!tokens) return {};
  const subgraphClient = uniswapGraphQLClient(chainId);
  if (!subgraphClient) {
    throw new Error("Subgraph not available");
  }
  const blockNumber = await getBlockNumberAtTime(startTime);
  console.log(blockNumber);
  const { pools } = await getSdk(subgraphClient).GetPools({
    where: {
      or: tokens.map((token) =>
        token.toLocaleLowerCase() > COLLATERAL_TOKENS[chainId].primary.address
          ? { token1: token.toLocaleLowerCase(), token0: COLLATERAL_TOKENS[chainId].primary.address }
          : { token0: token.toLocaleLowerCase(), token1: COLLATERAL_TOKENS[chainId].primary.address },
      ),
    },
    block: {
      number: blockNumber,
    },
  });

  return pools.reduce(
    (acc, curr) => {
      const isToken0SDAI = isTwoStringsEqual(curr.token0.id, COLLATERAL_TOKENS[chainId].primary.address);
      const outcomeTokenAddress = isToken0SDAI ? curr.token1.id : curr.token0.id;
      const outcomeTokenPrice = isToken0SDAI
        ? Number(curr.token1Price) / Number(curr.token0Price)
        : Number(curr.token0Price) / Number(curr.token1Price);
      acc[outcomeTokenAddress] = outcomeTokenPrice;
      return acc;
    },
    {} as { [key: string]: number },
  );
}

export async function getUniswapCurrentTokensPrices(tokens: string[] | undefined, chainId: SupportedChain) {
  if (!tokens) return {};
  const subgraphClient = uniswapGraphQLClient(chainId);
  if (!subgraphClient) {
    throw new Error("Subgraph not available");
  }

  const { pools } = await getSdk(subgraphClient).GetPools({
    where: {
      or: tokens.map((token) =>
        token.toLocaleLowerCase() > COLLATERAL_TOKENS[chainId].primary.address
          ? { token1: token.toLocaleLowerCase(), token0: COLLATERAL_TOKENS[chainId].primary.address }
          : { token0: token.toLocaleLowerCase(), token1: COLLATERAL_TOKENS[chainId].primary.address },
      ),
    },
  });

  return pools.reduce(
    (acc, curr) => {
      const isToken0SDAI = isTwoStringsEqual(curr.token0.id, COLLATERAL_TOKENS[chainId].primary.address);
      const outcomeTokenAddress = isToken0SDAI ? curr.token1.id : curr.token0.id;
      const outcomeTokenPrice = isToken0SDAI
        ? Number(curr.token1Price) / Number(curr.token0Price)
        : Number(curr.token0Price) / Number(curr.token1Price);
      acc[outcomeTokenAddress] = outcomeTokenPrice;
      return acc;
    },
    {} as { [key: string]: number },
  );
}
