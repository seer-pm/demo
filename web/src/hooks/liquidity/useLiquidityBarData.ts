import { useQuery } from "@tanstack/react-query";
import { getLiquidityBarData } from "./getLiquidityBarData";

export function useLiquidityBarData() {
  return useQuery<void, Error>({
    queryKey: ["useLiquidityBarData"],
    queryFn: async () => {
      return getLiquidityBarData();
    },
  });
}
