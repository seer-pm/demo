import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import type { SupportedChain } from "@seer-pm/sdk";
import { writeRealitySubmitAnswer } from "@seer-pm/sdk/contracts/reality";
import { useMutation } from "@tanstack/react-query";
import { TransactionReceipt } from "viem";

interface SubmitAnswerProps {
  questionId: `0x${string}`;
  outcome: `0x${string}`;
  currentBond: bigint;
  chainId: SupportedChain;
  onTransactionHash?: (hash: `0x${string}`) => void;
}

/** Submits the bonded answer and exposes its hash while confirmation is pending. */
async function submitAnswer(props: SubmitAnswerProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    async () => {
      const hash = await writeRealitySubmitAnswer(config, {
        args: [props.questionId, props.outcome, props.currentBond],
        value: props.currentBond,
        chainId: props.chainId,
      });
      props.onTransactionHash?.(hash);
      return hash;
    },
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

/** Refreshes the market after a Reality submission confirms. */
export const useSubmitAnswer = () => {
  return useMutation({
    mutationFn: submitAnswer,
    onSuccess: (data, { chainId, questionId }) => {
      queryClient.invalidateQueries({ queryKey: ["useMarket"] });
      if (data.status === "success") {
        queryClient.invalidateQueries({ queryKey: ["realityAnswerHistory", chainId, questionId] });
      }
    },
  });
};
