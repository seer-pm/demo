import { queryClient } from "@/lib/query-client";
import { useMutation } from "@tanstack/react-query";
//import { TransactionReceipt } from "viem";

interface SwapTokensProps {

}

async function swapTokens(_props: SwapTokensProps): Promise</*TransactionReceipt*/ boolean> {
  return true
}

export const useSwapTokens = (onSuccess: (data: /*TransactionReceipt*/ boolean) => unknown) => {
  return useMutation({
    mutationFn: swapTokens,
    onSuccess: (data: /*TransactionReceipt*/ boolean) => {
      queryClient.invalidateQueries({ queryKey: ["usePositions"] });
      queryClient.invalidateQueries({ queryKey: ["useERC20Balance"] });
      onSuccess(data);
    },
  });
};
