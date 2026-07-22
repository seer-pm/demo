import { useQuery } from "@tanstack/react-query";

export interface AirdropDataByUser {
  outcomeTokenHoldingAllocation: number;
  pohUserAllocation: number;
  totalAllocation: number;
  currentWeekAllocation: number;
  serLppMainnet: number;
  serLppGnosis: number;
  monthlyEstimate: number;
  monthlyEstimatePoH: number;
}

export class AirdropFetchError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "AirdropFetchError";
  }
}

export const useGetAirdropDataByUser = (user: string | undefined) => {
  return useQuery<AirdropDataByUser, AirdropFetchError>({
    queryKey: ["useGetAirdropData", user],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    // retry server-side failures (timeouts, 5xx) but never bad requests
    retry: (failureCount, error) => failureCount < 3 && (error.status ?? 500) >= 500,
    retryDelay: (attempt) => Math.min(8000, 1000 * 2 ** attempt),
    queryFn: async () => {
      const res = await fetch("/.netlify/functions/get-airdrop-data-by-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: user }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new AirdropFetchError(data.error ?? "Could not load airdrop data.", data.code, res.status);
      }
      return data;
    },
  });
};
