import { SupportedChain } from "@/lib/chains";
import { queryClient } from "@/lib/query-client";
import { formatOutcome, getCurrentBond } from "@/lib/reality";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { TransactionReceipt } from "viem";
import { realityAbi, realityAddress } from "./contracts/generated";

interface SubmitAnswerProps {
  questionId: `0x${string}`;
  outcome: string;
  currentBond: bigint;
  minBond: bigint;
  chainId: SupportedChain;
}

async function submitAnswer(props: SubmitAnswerProps): Promise<TransactionReceipt> {
  const hash = await writeContract(config, {
    address: realityAddress[props.chainId],
    abi: realityAbi,
    functionName: "submitAnswer",
    args: [props.questionId, formatOutcome(props.outcome), props.currentBond],
    value: getCurrentBond(props.currentBond, props.minBond),
  });

  const transactionReceipt = await waitForTransactionReceipt(config, {
    hash,
  });

  return transactionReceipt as TransactionReceipt;
}

export const useSubmitAnswer = (onSuccess: (data: TransactionReceipt) => unknown) => {
  return useMutation({
    mutationFn: submitAnswer,
    onSuccess: (data: TransactionReceipt) => {
      queryClient.invalidateQueries({ queryKey: ["useMarket"] });
      onSuccess(data);
    },
  });
};
