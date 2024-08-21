import { NATIVE_TOKEN } from "@/lib/utils";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { getBalance } from "@wagmi/core";
import { Address } from "viem";

export async function fetchTokenBalance(token: Address, owner: Address) {
  return (
    await getBalance(config, {
      address: owner,
      token: token.toLowerCase() === NATIVE_TOKEN ? undefined : token,
    })
  ).value;
}

export const useTokenBalance = (owner?: Address, token?: Address) => {
  return useQuery<bigint | undefined, Error>({
    enabled: !!owner && !!token,
    queryKey: ["useTokenBalance", owner, token],
    queryFn: async () => {
      return await fetchTokenBalance(token!, owner!);
    },
    refetchOnWindowFocus: true,
  });
};

export const useTokenBalances = (owner?: Address, tokens?: Address[]) => {
  return useQuery<bigint[] | undefined, Error>({
    enabled: !!owner && tokens && tokens.length > 0,
    queryKey: ["useTokenBalances", owner, tokens],
    queryFn: async () => {
      return await Promise.all(tokens!.map((token) => fetchTokenBalance(token, owner!)));
    },
  });
};
