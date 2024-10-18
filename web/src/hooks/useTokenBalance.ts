import { SupportedChain } from "@/lib/chains";
import { NATIVE_TOKEN } from "@/lib/utils";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { getBalance } from "@wagmi/core";
import { Address } from "viem";

export async function fetchTokenBalance(token: Address, owner: Address, chainId: SupportedChain) {
  return (
    await getBalance(config, {
      address: owner,
      token: token.toLowerCase() === NATIVE_TOKEN ? undefined : token,
      chainId,
    })
  ).value;
}

export const useTokenBalance = (owner: Address | undefined, token: Address | undefined, chainId: SupportedChain) => {
  return useQuery<bigint | undefined, Error>({
    enabled: !!owner && !!token,
    queryKey: ["useTokenBalance", owner, token, chainId],
    queryFn: async () => {
      return await fetchTokenBalance(token!, owner!, chainId);
    },
    refetchOnWindowFocus: true,
  });
};

export const useTokenBalances = (owner: Address | undefined, tokens: Address[], chainId: SupportedChain) => {
  return useQuery<bigint[] | undefined, Error>({
    enabled: !!owner && tokens.length > 0,
    queryKey: ["useTokenBalances", owner, tokens, chainId],
    queryFn: async () => {
      return await Promise.all(tokens!.map((token) => fetchTokenBalance(token, owner!, chainId)));
    },
    refetchOnWindowFocus: true,
  });
};
