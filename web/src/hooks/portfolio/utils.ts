import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { isTwoStringsEqual, isUndefined } from "@/lib/utils";
import { config } from "@/wagmi";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi } from "viem";

export function getTokenPricesMapping(
  positions: { parentMarketId?: string; tokenId: string; collateralToken?: string }[],
  pools: { token0: { id: string }; token1: { id: string }; token0Price: string; token1Price: string }[],
  chainId: SupportedChain,
) {
  const [simpleTokens, conditionalTokens] = positions.reduce(
    (acc, curr) => {
      acc[!isUndefined(curr.parentMarketId) ? 1 : 0].push(curr);
      return acc;
    },
    [[], []] as { parentMarketId?: string; tokenId: string; collateralToken?: string }[][],
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
    {} as { [key: string]: number | undefined },
  );

  const conditionalTokensMapping = conditionalTokens.reduce(
    (acc, { tokenId, collateralToken }) => {
      let isTokenPrice0 = true;
      const correctPool = pools.find((pool) => {
        if (collateralToken!.toLocaleLowerCase() > tokenId.toLocaleLowerCase()) {
          isTokenPrice0 = false;
          return isTwoStringsEqual(pool.token0.id, tokenId) && isTwoStringsEqual(pool.token1.id, collateralToken);
        }
        return isTwoStringsEqual(pool.token1.id, tokenId) && isTwoStringsEqual(pool.token0.id, collateralToken);
      });

      const relativePrice = correctPool
        ? isTokenPrice0
          ? Number(correctPool.token0Price)
          : Number(correctPool.token1Price)
        : 0;

      acc[tokenId.toLocaleLowerCase()] =
        relativePrice * (simpleTokensMapping?.[collateralToken!.toLocaleLowerCase()] || 0);
      return acc;
    },
    {} as { [key: string]: number },
  );

  return { ...simpleTokensMapping, ...conditionalTokensMapping };
}

export async function getTokensInfo(tokenAddresses: readonly Address[], account: Address) {
  const functions = [
    {
      name: "balanceOf",
      args: [account],
    },
    {
      name: "name",
      args: [],
    },
    {
      name: "decimals",
      args: [],
    },
  ];
  const data = await Promise.all(
    functions.map(({ name, args }) =>
      readContracts(config, {
        contracts: tokenAddresses.map((wrappedAddress) => ({
          abi: erc20Abi,
          address: wrappedAddress,
          functionName: name,
          args,
        })),
        allowFailure: false,
      }),
    ),
  );
  const balances = data[0] as bigint[];
  const names = data[1] as string[];
  const decimals = data[2] as bigint[];
  return { balances, names, decimals };
}
