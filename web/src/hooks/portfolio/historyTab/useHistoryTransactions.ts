import { SupportedChain } from "@/lib/chains";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { TransactionData } from "./types";

export const useHistoryTransactions = (
  address: Address,
  chainId: SupportedChain,
  startTime: number | undefined,
  endTime: number | undefined,
) => {
  return useQuery<TransactionData[] | undefined, Error>({
    enabled: !!address,
    queryKey: ["useHistoryTransactions", address, chainId, startTime, endTime],
    gcTime: 1000 * 60 * 60 * 24, //24 hours
    staleTime: 0,
    retry: false,
    queryFn: async () => {
      const response = await fetch(
        `/.netlify/functions/get-transactions?account=${address}&chainId=${chainId}${startTime ? `&startTime=${startTime}` : ""}${endTime ? `&endTime=${endTime}` : ""}`,
      );

      if (!response.ok) {
        throw new Error("Error fetching transactions");
      }

      return (await response.json()) as TransactionData[];
    },
  });
};
