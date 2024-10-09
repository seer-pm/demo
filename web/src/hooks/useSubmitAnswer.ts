import { SupportedChain } from "@/lib/chains";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { TransactionReceipt } from "viem";
import { writeRealitySubmitAnswer } from "./contracts/generated";

interface SubmitAnswerProps {
  questionId: `0x${string}`;
  outcome: `0x${string}`;
  currentBond: bigint;
  chainId: SupportedChain;
}

async function submitAnswer(props: SubmitAnswerProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () =>
      writeRealitySubmitAnswer(config, {
        args: [props.questionId, props.outcome, props.currentBond],
        value: props.currentBond,
      }),
    {
      txSent: { title: "Sending answer..." },
      txSuccess: { title: "Answer sent!" },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
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
