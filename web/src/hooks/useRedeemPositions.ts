import { useCheck7702Support } from "@/hooks/useCheck7702Support";
import { toastifySendCallsTx, toastifyTx } from "@/lib/toastify";
import { type UseMissingApprovalsProps, useRedeemPositions as useRedeemPositionsBase } from "@seer-pm/react";

export function useRedeemPositions(approvalsConfig: UseMissingApprovalsProps, onSuccess?: () => void) {
  const supports7702 = useCheck7702Support();
  return useRedeemPositionsBase(approvalsConfig, onSuccess, supports7702, toastifyTx, toastifySendCallsTx);
}
