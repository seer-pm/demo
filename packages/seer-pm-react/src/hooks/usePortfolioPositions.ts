import type { PortfolioChainId, PortfolioPosition } from "@seer-pm/sdk";
import { fetchPortfolioPositions, getActiveCollateralProfileName } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Address } from "viem";

export type { PortfolioPosition } from "@seer-pm/sdk";

export function usePortfolioPositions(address: Address | undefined, chainId: PortfolioChainId) {
  const profile = getActiveCollateralProfileName();
  const query = useQuery<PortfolioPosition[], Error>({
    enabled: !!address,
    queryKey: ["usePortfolioPositions", address, profile],
    queryFn: () => fetchPortfolioPositions(address!, "all", profile),
  });
  const data = useMemo(() => {
    if (!query.data) return query.data;
    if (chainId === "all") return query.data;
    return query.data.filter((p) => p.chainId === chainId);
  }, [query.data, chainId]);
  return { ...query, data };
}
