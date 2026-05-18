import type { PortfolioValueApiResponse, SupportedChain } from "@seer-pm/sdk";
import { fetchPortfolioValue, getActiveCollateralProfileName } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";

export function usePortfolioValue(account: Address | undefined, chainId: SupportedChain | undefined) {
  return useQuery<PortfolioValueApiResponse | undefined, Error>({
    queryKey: ["portfolioValue", account, chainId],
    queryFn: () => fetchPortfolioValue(account as Address, chainId!, getActiveCollateralProfileName()),
    enabled: Boolean(account && chainId !== undefined),
    staleTime: 60_000,
  });
}
