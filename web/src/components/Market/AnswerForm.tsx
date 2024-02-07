import { useForm } from "react-hook-form";
import { Address, TransactionReceipt } from "viem";
import { useAccount } from "wagmi";
import { Market } from "../../hooks/useMarket";
import { useSubmitAnswer } from "../../hooks/useSubmitAnswer";
import { getConfigAddress } from "../../lib/config";
import Button from "../Form/Button";
import Select from "../Form/Select";

interface AnswerFormValues {
  outcome: string;
}

interface AnswerFormProps {
  account?: Address;
  market: Market;
}

export function AnswerForm({ market }: AnswerFormProps) {
  const { chainId } = useAccount();
  return (
    <a
      href={`https://reality.eth.limo/app/#!/network/${chainId}/question/${getConfigAddress("REALITIO", chainId)}-${
        market.questionId
      }`}
      className="text-primary"
      target="_blank"
      rel="noreferrer"
    >
      Go to Reality.eth
    </a>
  );
}

/*export function AnswerForm({
  market,
}: AnswerFormProps) {
  const {chainId, address} = useAccount();

  const {
    register,
    reset,
    formState: { errors, isValid },
    handleSubmit,
  } = useForm<AnswerFormValues>({
    mode: "all",
    defaultValues: {
      outcome: '',
    },
  });

  const submitAnswer = useSubmitAnswer((_receipt: TransactionReceipt) => {
    reset();
    alert("Answer submited!");
  });

  const onSubmit = async (values: AnswerFormValues) => {
    await submitAnswer.mutateAsync({
      questionId: market.questionId,
      outcome: values.outcome,
      currentBond: market.question.bond,
      minBod: market.question.min_bond,
      chainId,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <div className="font-bold">Result</div>
        <Select
          options={market.outcomes.map((outcome, i) => ({value: i, text: outcome}))}
          {...register("outcome", {
            required: "This field is required.",
          })}
          className="w-full md:w-2/3"
          errors={errors}
        />
      </div>

      <div>
        <Button
          className="btn btn-primary"
          type="submit"
          disabled={!isValid || submitAnswer.isPending || !address}
          isLoading={submitAnswer.isPending}
          text="Submit"
        />
      </div>
    </form>
  );
}*/
