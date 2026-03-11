import { useCheck7702Support } from "@/hooks/useCheck7702Support";
import { toastifySendCallsTx, toastifyTx } from "@/lib/toastify";
import { type UseMissingApprovalsProps, useMergePositions as useMergePositionsBase } from "@seer-pm/react";
import type { TransactionReceipt } from "viem";

export function useMergePositions(
  approvalsConfig: UseMissingApprovalsProps,
  onSuccess?: (data: TransactionReceipt) => unknown,
) {
  const supports7702 = useCheck7702Support();
  return useMergePositionsBase(approvalsConfig, onSuccess ?? (() => {}), supports7702, toastifyTx, toastifySendCallsTx);
}
