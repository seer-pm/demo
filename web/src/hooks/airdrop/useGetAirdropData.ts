import { useQuery } from "@tanstack/react-query";

export interface AirdropData {
  user: string;
  chainId: number;
  currentWeekCount: number;
  currentMonthCount: number;
  totalCount: number;
}

export const useGetAirdropData = () => {
  return useQuery<AirdropData[] | undefined, Error>({
    queryKey: ["useGetAirdropData"],
    retry: false,
    queryFn: async () => {
      const data = await fetch("/.netlify/functions/get-airdrop-data").then((res) => res.json());
      return data.data.map(
        (x: {
          address: string;
          chain_id: string;
          current_week_seer_tokens: number;
          current_month_seer_tokens: number;
          total_seer_tokens: number;
        }) => ({
          user: x.address,
          chainId: x.chain_id,
          currentWeekCount: x.current_week_seer_tokens,
          currentMonthCount: x.current_month_seer_tokens,
          totalCount: x.total_seer_tokens,
        }),
      );
    },
  });
};
