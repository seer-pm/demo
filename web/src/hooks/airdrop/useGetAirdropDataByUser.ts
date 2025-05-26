import { useQuery } from "@tanstack/react-query";

export interface AirdropDataByUser {
  outcomeTokenHoldingAllocation: number;
  pohUserAllocation: number;
  totalAllocation: number;
  currentWeekAllocation: number;
}

export const useGetAirdropDataByUser = (user: string | undefined, chainId: number | undefined) => {
  return useQuery<AirdropDataByUser | undefined, Error>({
    queryKey: ["useGetAirdropData", user, chainId],
    enabled: !!user && !!chainId,
    retry: false,
    queryFn: async () => {
      const data = await fetch("/.netlify/functions/get-airdrop-data-by-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: user, chainId }),
      }).then((res) => res.json());
      return data;
    },
  });
};
