import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";

export type PortfolioIdentityResponse = {
  account: Address;
  /** TradeExecutor contracts the account owns. Empty for almost every wallet. */
  executors: Address[];
};

export const usePortfolioIdentity = (address: Address | undefined) => {
  return useQuery<PortfolioIdentityResponse | undefined, Error>({
    enabled: !!address,
    queryKey: ["usePortfolioIdentity", address],
    // Executor deployment is a one-off; there is nothing to poll for.
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 24,
    retry: false,
    queryFn: async () => {
      const response = await fetch(`/.netlify/functions/get-portfolio-identity?account=${address}`);
      if (!response.ok) {
        throw new Error("Error fetching portfolio identity");
      }
      return (await response.json()) as PortfolioIdentityResponse;
    },
  });
};
