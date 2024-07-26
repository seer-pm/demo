import { useMutation } from "@tanstack/react-query";
import { TransactionReceipt } from "viem";
import { wrapXDAI } from "./trade/handleXDAI";

export const useWrapXDAI = (onSuccess?: (data: TransactionReceipt) => unknown) => {
  return useMutation({
    mutationFn: wrapXDAI,
    onSuccess: (data: TransactionReceipt) => {
      onSuccess?.(data);
    },
  });
};
