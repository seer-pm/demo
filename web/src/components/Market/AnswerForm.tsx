import Button from "@/components/Form/Button";
import Select from "@/components/Form/Select";
import { Market } from "@/hooks/useMarket";
import { useSubmitAnswer } from "@/hooks/useSubmitAnswer";
import { SupportedChain } from "@/lib/chains";
import { getRealityLink } from "@/lib/reality";
import { useForm } from "react-hook-form";
import { Address } from "viem";
import { useAccount } from "wagmi";

interface AnswerFormValues {
  outcome: string;
}

interface AnswerFormProps {
  account?: Address;
  market: Market;
}

export function AnswerFormLink({ market }: AnswerFormProps) {
  const { chainId } = useAccount();
  return (
    <a
      href={getRealityLink(chainId as SupportedChain, market.questionId)}
      className="text-purple-primary"
      target="_blank"
      rel="noreferrer"
    >
      Go to Reality.eth
    </a>
  );
}

export function AnswerForm({ market }: AnswerFormProps) {
  const { chainId, address } = useAccount();

  const {
    register,
    reset,
    formState: { errors, isValid },
    handleSubmit,
  } = useForm<AnswerFormValues>({
    mode: "all",
    defaultValues: {
      outcome: "",
    },
  });

  const submitAnswer = useSubmitAnswer((/*receipt: TransactionReceipt*/) => {
    reset();
  });

  const onSubmit = async (values: AnswerFormValues) => {
    await submitAnswer.mutateAsync({
      questionId: market.questionId,
      outcome: values.outcome,
      currentBond: market.questions[0].bond, // TODO: refactor for multi scalar markets
      minBond: market.questions[0].min_bond, // TODO: refactor for multi scalar markets
      chainId: chainId! as SupportedChain,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <div className="font-bold">Result</div>
        <Select
          options={market.outcomes.map((outcome, i) => ({ value: i, text: outcome }))}
          {...register("outcome", {
            required: "This field is required.",
          })}
          className="w-full md:w-2/3"
          errors={errors}
        />
      </div>

      <div>
        <Button
          variant="primary"
          type="submit"
          disabled={!isValid || submitAnswer.isPending || !address || !chainId}
          isLoading={submitAnswer.isPending}
          text="Submit"
        />
      </div>
    </form>
  );
}
