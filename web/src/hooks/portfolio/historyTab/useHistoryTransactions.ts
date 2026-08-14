import type { SupportedChain, TransactionData } from "@seer-pm/sdk";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Address } from "viem";

export type HistoryTransactions = {
  transactions: TransactionData[];
  /** The server capped at least one source; older events exist that aren't in this list. */
  truncated: boolean;
};

export const useHistoryTransactions = (
  address: Address,
  chainId: SupportedChain,
  startTime: number | undefined,
  endTime: number | undefined,
  limit?: number,
) => {
  return useQuery<HistoryTransactions | undefined, Error>({
    enabled: !!address,
    queryKey: ["useHistoryTransactions", address, chainId, startTime, endTime, limit],
    gcTime: 1000 * 60 * 60 * 24, //24 hours
    staleTime: 1000 * 60, // 1 min — matches the endpoint's Cache-Control
    placeholderData: keepPreviousData,
    retry: false,
    queryFn: async () => {
      const response = await fetch(
        `/.netlify/functions/get-transactions?account=${address}&chainId=${chainId}${startTime ? `&startTime=${startTime}` : ""}${endTime ? `&endTime=${endTime}` : ""}${limit === undefined ? "" : `&limit=${limit}`}`,
      );

      if (!response.ok) {
        throw new Error("Error fetching transactions");
      }

      return {
        transactions: (await response.json()) as TransactionData[],
        truncated: response.headers.get("X-History-Truncated") === "true",
      };
    },
  });
};
