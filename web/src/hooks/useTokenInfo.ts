import { isUndefined } from "@/lib/utils";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi } from "viem";

interface GetTokenResult {
  address: Address;
  decimals: number;
  name: string;
  symbol: string;
}

export async function getTokenInfo(address: Address): Promise<GetTokenResult> {
  const [decimals, name, symbol] = await readContracts(config, {
    allowFailure: false,
    contracts: [
      {
        address,
        abi: erc20Abi,
        functionName: "decimals",
      },
      {
        address,
        abi: erc20Abi,
        functionName: "name",
      },
      {
        address,
        abi: erc20Abi,
        functionName: "symbol",
      },
    ],
  });

  return { address, decimals, name, symbol };
}

export const useTokensInfo = (tokens?: Address[]) => {
  return useQuery<GetTokenResult[] | undefined, Error>({
    enabled: !isUndefined(tokens) && tokens.length > 0,
    queryKey: ["useTokens", tokens],
    queryFn: async () => {
      return await Promise.all(tokens!.map((token) => getTokenInfo(token)));
    },
  });
};

export const useTokenInfo = (token?: Address) => {
  return useQuery<GetTokenResult | undefined, Error>({
    enabled: !isUndefined(token),
    queryKey: ["useToken", token],
    queryFn: async () => {
      return await getTokenInfo(token!);
    },
  });
};
