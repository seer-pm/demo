import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { TransactionReceipt } from "viem";
import { writeRealityReopenQuestion } from "./contracts/generated";
import { Question } from "./useMarket";
import { SUBGRAPH_EMPTY_BYTES } from "@/lib/config";

interface ResolveMarketProps {
  question: Question;
  templateId: bigint;
  encodedQuestion: string;
}

async function reopenQuestion(props: ResolveMarketProps): Promise<TransactionReceipt> {console.log('questionId', props.question.id, 'reopensQuestionId', props.question.reopensQuestionId, props.question.reopensQuestionId === SUBGRAPH_EMPTY_BYTES ?  props.question.id : props.question.reopensQuestionId);
  const result = await toastifyTx(
    () =>
      writeRealityReopenQuestion(config, {
        args: [
          props.templateId,
          props.encodedQuestion,
          props.question.arbitrator,
          props.question.timeout,
          props.question.opening_ts,
          0n,
          props.question.min_bond,
          props.question.reopensQuestionId === SUBGRAPH_EMPTY_BYTES ?  props.question.id : props.question.reopensQuestionId,
        ],
      }),
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
      queryClient.invalidateQueries({ queryKey: ["useMarketStatus"] });
    },
  });
};
