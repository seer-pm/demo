import type { Market } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import type { Address } from "viem";
import { erc20Abi } from "viem";
import { useConfig } from "wagmi";
import { useTokensInfo } from "./useTokenInfo";

export type Position = { tokenId: Address; balance: bigint; symbol: string; decimals: number };

export const useMarketPositions = (address: Address | undefined, market: Market) => {
  const config = useConfig();
  const { data: tokensInfo } = useTokensInfo(market.wrappedTokens, market.chainId);

  return useQuery<Position[] | undefined, Error>({
    enabled: !!address && tokensInfo && tokensInfo.length > 0,
    queryKey: ["useMarketPositions", address, market.id],
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const balances = (await readContracts(config, {
        contracts: market.wrappedTokens!.map((wrappedAddress) => ({
          abi: erc20Abi,
          address: wrappedAddress,
          functionName: "balanceOf",
          args: [address],
        })),
        allowFailure: false,
      })) as bigint[];

      return tokensInfo!.map((tokenInfo, i) => ({
        tokenId: tokenInfo.address,
        balance: balances[i],
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
      }));
    },
  });
};
