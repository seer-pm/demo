import type { TransactionData } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";

export const useHistoryTransactions = (address: Address | undefined) => {
  return useQuery<TransactionData[] | undefined, Error>({
    enabled: !!address,
    queryKey: ["useHistoryTransactions", address],
    gcTime: 1000 * 60 * 60 * 24,
    staleTime: 0,
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
