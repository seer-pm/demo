import type { PortfolioValueApiResponse, SupportedChain } from "@seer-pm/sdk";
import { fetchPortfolioValue } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";

export function usePortfolioValue(account: Address | undefined, chainId: SupportedChain | undefined) {
  return useQuery<PortfolioValueApiResponse | undefined, Error>({
    queryKey: ["portfolioValue", account, chainId],
    queryFn: () => fetchPortfolioValue(account as Address, chainId as SupportedChain),
    enabled: Boolean(account && chainId !== undefined),
    staleTime: 60_000,
  });
}
