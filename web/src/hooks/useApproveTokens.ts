import { toastifyTx } from "@/lib/toastify";
import { useApproveTokens as useApproveTokensBase } from "@seer-pm/react";

export function useApproveTokens() {
  return useApproveTokensBase(toastifyTx);
}
