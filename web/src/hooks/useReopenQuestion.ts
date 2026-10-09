import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import type { SupportedChain } from "@seer-pm/sdk";
import { Question, getRealityAddress } from "@seer-pm/sdk";
import { realityAbi } from "@seer-pm/sdk/contracts/reality";
import { useMutation } from "@tanstack/react-query";
import { writeContract } from "@wagmi/core";
import type { Address, TransactionReceipt } from "viem";

interface ResolveMarketProps {
  question: Question;
  templateId: bigint;
  encodedQuestion: string;
  chainId: SupportedChain;
  /** Factory that created the market, which decides the Reality instance its questions live on. */
  factory: Address | undefined;
}

async function reopenQuestion(props: ResolveMarketProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () => {
      return writeContract(config, {
        address: getRealityAddress(props.chainId, props.factory),
        abi: realityAbi,
        functionName: "reopenQuestion",
        args: [
          props.templateId,
          props.encodedQuestion,
          props.question.arbitrator,
          props.question.timeout,
          props.question.opening_ts,
          0n,
          props.question.min_bond,
          props.question.base_question,
        ],
        chainId: props.chainId,
      });
    },
    {
      txSent: { title: "Reopening question..." },
      txSuccess: { title: "Question reopened!" },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

export const useReopenQuestion = () => {
  return useMutation({
    mutationFn: reopenQuestion,
    onSuccess: (/*data: TransactionReceipt*/) => {
      queryClient.invalidateQueries({ queryKey: ["useMarket"] });
    },
  });
};
