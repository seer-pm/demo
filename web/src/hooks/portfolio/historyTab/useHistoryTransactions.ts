import type { TransactionData } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";

export const useHistoryTransactions = (address: Address | undefined) => {
  return useQuery<TransactionData[] | undefined, Error>({
    enabled: !!address,
    queryKey: ["useHistoryTransactions", address],
    gcTime: 1000 * 60 * 60 * 24,
    // The portfolio page prefetches this and the History tab mounts it again; without a staleTime
    // (default 0) that is two fetches, plus one more on every window focus.
    staleTime: 1000 * 60 * 5,
    retry: false,
    queryFn: async () => {
      const response = await fetch(`/.netlify/functions/get-transactions?account=${address}`);
      if (!response.ok) {
        throw new Error("Error fetching transactions");
      }
      return (await response.json()) as TransactionData[];
    },
  });
};
