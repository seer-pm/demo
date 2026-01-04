import { SupportedChain, gnosis } from "@/lib/chains";
import { queryClient } from "@/lib/query-client";
import { NATIVE_TOKEN, isTwoStringsEqual, isUndefined } from "@/lib/utils";
import { config as wagmiConfig } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { Config, readContracts } from "@wagmi/core";
import { Address, erc20Abi } from "viem";

export interface GetTokenResult {
  address: Address;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
}

export async function getTokenInfo(address: Address, chainId: SupportedChain, config: Config): Promise<GetTokenResult> {
  if (isTwoStringsEqual(address, NATIVE_TOKEN)) {
    return {
      address,
      chainId,
      decimals: 18,
      name: chainId === gnosis.id ? "xDAI" : "ETH",
      symbol: chainId === gnosis.id ? "xDAI" : "ETH",
    };
  }

  const [decimals, name, symbol] = await readContracts(config, {
    allowFailure: false,
    contracts: [
      {
        address,
        abi: erc20Abi,
        functionName: "decimals",
        chainId,
      },
      {
        address,
        abi: erc20Abi,
        functionName: "name",
        chainId,
      },
      {
        address,
        abi: erc20Abi,
        functionName: "symbol",
        chainId,
      },
    ],
  });

  return { address, chainId, decimals, name, symbol };
}

export function getUseTokenQueryKey(token: Address | undefined, chainId: SupportedChain) {
  return ["useToken", token, chainId] as const;
}

export const useTokensInfo = (tokens: Address[] | undefined, chainId: SupportedChain) => {
  return useQuery<GetTokenResult[] | undefined, Error>({
    enabled: !isUndefined(tokens) && tokens.length > 0,
    queryKey: ["useTokens", tokens, chainId],
    queryFn: async () => {
      const tokensInfo = await Promise.all(tokens!.map((token) => getTokenInfo(token, chainId, wagmiConfig)));

      // Store preloaded tokens in individual cache entries for useTokenInfo
      for (const tokenInfo of tokensInfo) {
        queryClient.setQueryData(
          getUseTokenQueryKey(tokenInfo.address, tokenInfo.chainId as SupportedChain),
          tokenInfo,
        );
      }

      return tokensInfo;
    },
  });
};

export const useTokenInfo = (token: Address | undefined, chainId: SupportedChain) => {
  return useQuery<GetTokenResult | undefined, Error>({
    enabled: !isUndefined(token),
    queryKey: getUseTokenQueryKey(token, chainId),
    queryFn: async () => {
      return await getTokenInfo(token!, chainId, wagmiConfig);
    },
  });
};
