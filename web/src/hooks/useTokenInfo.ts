import { SupportedChain, gnosis } from "@/lib/chains";
import { NATIVE_TOKEN, isTwoStringsEqual, isUndefined } from "@/lib/utils";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi } from "viem";

export interface GetTokenResult {
  address: Address;
  decimals: number;
  name: string;
  symbol: string;
}

export async function getTokenInfo(address: Address, chainId: SupportedChain): Promise<GetTokenResult> {
  if (isTwoStringsEqual(address, NATIVE_TOKEN)) {
    return {
      address,
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

  return { address, decimals, name, symbol };
}

export const useTokensInfo = (tokens: Address[] | undefined, chainId: SupportedChain) => {
  return useQuery<GetTokenResult[] | undefined, Error>({
    enabled: !isUndefined(tokens) && tokens.length > 0,
    queryKey: ["useTokens", tokens, chainId],
    queryFn: async () => {
      return await Promise.all(tokens!.map((token) => getTokenInfo(token, chainId)));
    },
  });
};

export const useTokenInfo = (token: Address | undefined, chainId: SupportedChain) => {
  return useQuery<GetTokenResult | undefined, Error>({
    enabled: !isUndefined(token),
    queryKey: ["useToken", token, chainId],
    queryFn: async () => {
      return await getTokenInfo(token!, chainId);
    },
  });
};
