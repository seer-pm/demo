import { useQuery } from "@tanstack/react-query";

export interface AirdropDataByUser {
  outcomeTokenHoldingAllocation: number;
  pohUserAllocation: number;
  totalAllocation: number;
  currentWeekAllocation: number;
  serLppMainnet: number;
  serLppGnosis: number;
}

export const useGetAirdropDataByUser = (user: string | undefined) => {
  return useQuery<AirdropDataByUser | undefined, Error>({
    queryKey: ["useGetAirdropData", user],
    enabled: !!user,
    retry: false,
    queryFn: async () => {
      const data = await fetch("/.netlify/functions/get-airdrop-data-by-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: user }),
      }).then((res) => res.json());
      if (data.error) {
        throw { message: data.error };
      }
      return data;
    },
  });
};
