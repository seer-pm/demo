import type { PortfolioChainId, PortfolioMarketPnLResponse, PortfolioPnLPeriod } from "@seer-pm/sdk";
import { fetchPortfolioMarketPnL, getActiveCollateralProfileName } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";

export type { PortfolioMarketPnLResponse, PortfolioMarketPnLRow } from "@seer-pm/sdk";

/** Per-market P/L and traded volume for the account's wallet set, from the materialized leaderboard. */
export function usePortfolioMarketPnL(
  account: Address | undefined,
  chainId: PortfolioChainId | undefined,
  period: PortfolioPnLPeriod,
) {
  return useQuery<PortfolioMarketPnLResponse, Error>({
    enabled: Boolean(account && chainId !== undefined),
    queryKey: ["portfolioMarketPnL", account, chainId, period],
    retry: false,
    queryFn: () => fetchPortfolioMarketPnL(account as Address, chainId!, period, getActiveCollateralProfileName()),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
