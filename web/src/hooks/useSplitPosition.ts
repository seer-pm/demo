import { useCheck7702Support } from "@/hooks/useCheck7702Support";
import { toastifyTx } from "@/lib/toastify";
import { type UseMissingApprovalsProps, useSplitPosition as useSplitPositionBase } from "@seer-pm/react";
import type { TransactionReceipt } from "viem";

export function useSplitPosition(
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess?: (data: TransactionReceipt) => unknown,
) {
  const supports7702 = useCheck7702Support();
  return useSplitPositionBase(approvalsConfig, onSuccess ?? (() => {}), supports7702, toastifyTx);
}
