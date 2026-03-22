import type { SupportedChain } from "@seer-pm/sdk";
import { NATIVE_TOKEN } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import { getBalance, readContract } from "@wagmi/core";
import type { Address } from "viem";
import { erc20Abi } from "viem";
import { useConfig } from "wagmi";

export async function fetchTokenBalance(
  config: Parameters<typeof getBalance>[0],
  token: Address,
  owner: Address,
  chainId: SupportedChain,
) {
  const isNative = token.toLowerCase() === NATIVE_TOKEN.toLowerCase();
  if (isNative) {
    return (await getBalance(config, { address: owner, chainId })).value;
  }
  return readContract(config, {
    address: token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [owner],
    chainId,
  }) as Promise<bigint>;
}

export function useTokenBalance(owner: Address | undefined, token: Address | undefined, chainId: SupportedChain) {
  const config = useConfig();

  return useQuery<bigint | undefined, Error>({
    enabled: Boolean(owner && token),
    queryKey: ["useTokenBalance", owner, token, chainId],
    queryFn: async () => {
      return fetchTokenBalance(config, token!, owner!, chainId);
    },
    refetchOnWindowFocus: true,
  });
}

export function useTokenBalances(owner: Address | undefined, tokens: Address[], chainId: SupportedChain) {
  const config = useConfig();

  return useQuery<bigint[] | undefined, Error>({
    enabled: Boolean(owner && tokens.length > 0),
    queryKey: ["useTokenBalances", owner, tokens, chainId],
    queryFn: async () => {
      return Promise.all(tokens.map((token) => fetchTokenBalance(config, token, owner!, chainId)));
    },
    refetchOnWindowFocus: true,
  });
}
