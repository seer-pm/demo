import type { PortfolioChainId, PortfolioCostBasisResponse } from "@seer-pm/sdk";
import { fetchPortfolioCostBasis, getActiveCollateralProfileName } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";

export type { PortfolioCostBasisResponse, PortfolioCostBasisRow } from "@seer-pm/sdk";

/** Per-token cost basis for the account's wallet set, from the materialized `pnl_token_basis`. */
export function usePortfolioCostBasis(account: Address | undefined, chainId: PortfolioChainId | undefined) {
  return useQuery<PortfolioCostBasisResponse, Error>({
    enabled: Boolean(account && chainId !== undefined),
    queryKey: ["portfolioCostBasis", account, chainId],
    retry: false,
    queryFn: () => fetchPortfolioCostBasis(account as Address, chainId!, getActiveCollateralProfileName()),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
