import type { PortfolioPnLPeriod, SupportedChain } from "@seer-pm/sdk";
import { fetchPortfolioPnL } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";

export type { PortfolioPnLPeriod } from "@seer-pm/sdk";

export function usePortfolioPnL(
  account: Address | undefined,
  chainId: SupportedChain | undefined,
  period: PortfolioPnLPeriod,
) {
  return useQuery({
    enabled: Boolean(account && chainId !== undefined),
    queryKey: ["portfolioPnL", account, chainId, period],
    retry: false,
    queryFn: () => fetchPortfolioPnL(account as Address, chainId as SupportedChain, period),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
