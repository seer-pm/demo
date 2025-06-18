import { Question } from "@/lib/market";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { TransactionReceipt, zeroHash } from "viem";
import { writeRealityReopenQuestion } from "./contracts/generated-reality";

interface ResolveMarketProps {
  question: Question;
  templateId: bigint;
  encodedQuestion: string;
}

async function reopenQuestion(props: ResolveMarketProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () => {
      if (props.question.base_question === zeroHash) {
        // this question was loaded using marketView, it doesn't have information about the baseQuestion
        // it needs to be loadad using the subgraph
        throw new Error("Incorrect base question, please try again later.");
      }

      return writeRealityReopenQuestion(config, {
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
