import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { useResolveMarket as useResolveMarketBase } from "@seer-pm/react";

/**
 * App-specific resolve market hook: wires toast notifications and invalidates useMarket on success.
 */
export function useResolveMarket() {
  return useResolveMarketBase({
    txNotifier: toastifyTx,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["useMarket"] });
    },
  });
}
