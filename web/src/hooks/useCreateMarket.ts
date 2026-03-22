import { toastifyTx } from "@/lib/toastify";
import { useCreateMarket as useCreateMarketBase } from "@seer-pm/react";
import type { TransactionReceipt } from "viem";

/**
 * App-specific create market hook: wires toast notifications.
 * Caller must pass full CreateMarketProps including minBond (e.g. from getConfigNumber("MIN_BOND", chainId)).
 */
export function useCreateMarket(isFutarchyMarket: boolean, onSuccess: (data: TransactionReceipt) => void) {
  return useCreateMarketBase({
    txNotifier: toastifyTx,
    isFutarchyMarket,
    onSuccess,
  });
}
