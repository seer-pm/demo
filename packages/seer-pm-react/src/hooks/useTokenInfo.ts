import type { GetTokenResult, SupportedChain } from "@seer-pm/sdk";
import { getTokenInfo, getTokensInfo } from "@seer-pm/sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Address } from "viem";
import { useClient } from "wagmi";

function isUndefined(value: unknown): value is undefined | null {
  return value === undefined || value === null;
}

export type { GetTokenResult };

export function getUseTokenQueryKey(token: Address | undefined, chainId: SupportedChain) {
  return ["useToken", token, chainId] as const;
}

export function useTokensInfo(tokens: Address[] | undefined, chainId: SupportedChain) {
  const client = useClient({ chainId });
  const queryClient = useQueryClient();

  return useQuery<GetTokenResult[] | undefined, Error>({
    enabled: !!client && !isUndefined(tokens) && (tokens?.length ?? 0) > 0,
    queryKey: ["useTokens", tokens, chainId],
    queryFn: async () => {
      const tokensInfo = await getTokensInfo(tokens!, chainId, client!);
      for (const tokenInfo of tokensInfo) {
        queryClient.setQueryData(
          getUseTokenQueryKey(tokenInfo.address, tokenInfo.chainId as SupportedChain),
          tokenInfo,
        );
      }

      return tokensInfo;
    },
  });
}

export function useTokenInfo(token: Address | undefined, chainId: SupportedChain) {
  const client = useClient({ chainId });

  return useQuery<GetTokenResult | undefined, Error>({
    enabled: !!client && !isUndefined(token),
    queryKey: getUseTokenQueryKey(token, chainId),
    queryFn: async () => getTokenInfo(token!, chainId, client!),
  });
}
