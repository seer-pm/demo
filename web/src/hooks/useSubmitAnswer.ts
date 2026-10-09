import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import type { SupportedChain } from "@seer-pm/sdk";
import { getRealityAddress } from "@seer-pm/sdk";
import { realityAbi } from "@seer-pm/sdk/contracts/reality";
import { useMutation } from "@tanstack/react-query";
import { writeContract } from "@wagmi/core";
import type { Address, TransactionReceipt } from "viem";

interface SubmitAnswerProps {
  questionId: `0x${string}`;
  outcome: `0x${string}`;
  currentBond: bigint;
  chainId: SupportedChain;
  /** Factory that created the market, which decides the Reality instance its questions live on. */
  factory: Address | undefined;
}

async function submitAnswer(props: SubmitAnswerProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () =>
      writeContract(config, {
        address: getRealityAddress(props.chainId, props.factory),
        abi: realityAbi,
        functionName: "submitAnswer",
        args: [props.questionId, props.outcome, props.currentBond],
        value: props.currentBond,
        chainId: props.chainId,
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
