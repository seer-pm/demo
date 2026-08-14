import type { PortfolioChainId, PortfolioPnLPeriod } from "@seer-pm/sdk";
import { fetchPortfolioPnL, getActiveCollateralProfileName } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";

export type { PortfolioPnLPeriod } from "@seer-pm/sdk";

export function usePortfolioPnL(
  account: Address | undefined,
  chainId: PortfolioChainId | undefined,
  period: PortfolioPnLPeriod,
  marketId?: Address,
) {
  const enabled = Boolean(account && chainId !== undefined && !(marketId && chainId === "all"));
  return useQuery({
    enabled,
    queryKey: ["portfolioPnL", account, chainId, period, marketId],
    retry: false,
    queryFn: () => {
      return fetchPortfolioPnL(account as Address, chainId!, period, getActiveCollateralProfileName(), marketId);
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
