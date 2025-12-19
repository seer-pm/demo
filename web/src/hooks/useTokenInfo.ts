import { SupportedChain, gnosis } from "@/lib/chains";
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

export const useTokensInfo = (tokens: Address[] | undefined, chainId: SupportedChain) => {
  return useQuery<GetTokenResult[] | undefined, Error>({
    enabled: !isUndefined(tokens) && tokens.length > 0,
    queryKey: ["useTokens", tokens, chainId],
    queryFn: async () => {
      return await Promise.all(tokens!.map((token) => getTokenInfo(token, chainId, wagmiConfig)));
    },
  });
};

export const useTokenInfo = (token: Address | undefined, chainId: SupportedChain) => {
  return useQuery<GetTokenResult | undefined, Error>({
    enabled: !isUndefined(token),
    queryKey: ["useToken", token, chainId],
    queryFn: async () => {
      return await getTokenInfo(token!, chainId, wagmiConfig);
    },
  });
};
