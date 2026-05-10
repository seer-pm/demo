import type { PortfolioPosition, SupportedChain } from "@seer-pm/sdk";
import { fetchPortfolioPositions } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";

export type { PortfolioPosition } from "@seer-pm/sdk";

export function usePortfolioPositions(address: Address | undefined, chainId: SupportedChain) {
  return useQuery<PortfolioPosition[] | undefined, Error>({
    enabled: !!address,
    queryKey: ["usePortfolioPositions", address, chainId],
    queryFn: () => fetchPortfolioPositions(address!, chainId),
  });
}
