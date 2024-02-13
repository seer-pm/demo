import { FieldErrors, UseFormRegister, useFieldArray, useForm } from "react-hook-form";

import { MarketFactoryAbi } from "@/abi/MarketFactoryAbi";
import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import Select from "@/components/Form/Select";
import { useCreateMarket } from "@/hooks/useCreateMarket";
import { DEFAULT_CHAIN } from "@/lib/config";
import { paths } from "@/lib/paths";
import { REALITY_TEMPLATE_SINGLE_SELECT, encodeQuestionText } from "@/lib/reality";
import { localTimeToUtc } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { TransactionReceipt } from "viem";
import { parseEventLogs } from "viem/utils";
import { useAccount } from "wagmi";

export const MARKET_CATEGORIES: { value: string; text: string }[] = [
  { value: "sports", text: "Sports" },
  { value: "technology", text: "Technology" },
  { value: "politics", text: "Politics" },
  { value: "misc", text: "Miscellaneous" },
];

interface MarketFormValues {
  market: string;
  outcomes: { value: string }[];
  category: string;
  openingTime: string;
}

interface OutcomeFieldsProps {
  outcomeIndex: number;
  removeOutcome: (i: number) => void;
  errors: FieldErrors;
  register: UseFormRegister<MarketFormValues>;
}

function OutcomeFields({ outcomeIndex, removeOutcome, errors, register }: OutcomeFieldsProps) {
  return (
    <div className="relative w-full md:w-2/3 mx-auto">
      <Input
        autoComplete="off"
        {...register(`outcomes.${outcomeIndex}.value`, {
          required: "This field is required.",
        })}
        className="w-full"
        errors={errors}
      />

      <button
        type="button"
        onClick={() => removeOutcome(outcomeIndex)}
        className="btn btn-sm absolute inset-y-2 right-2"
      >
        Remove
      </button>
    </div>
  );
}

export default function MarketForm() {
  const navigate = useNavigate();
  const { chain, chainId = DEFAULT_CHAIN } = useAccount();
  const createMarket = useCreateMarket((receipt: TransactionReceipt) => {
    const marketId = parseEventLogs({
      abi: MarketFactoryAbi,
      eventName: "NewMarket",
      logs: receipt.logs,
    })?.[0]?.args?.market;

    if (marketId) {
      navigate(paths.market(marketId, chainId));
    }
  });

  const {
    register,
    control,
    formState: { errors, isValid },
    handleSubmit,
  } = useForm<MarketFormValues>({
    mode: "all",
    defaultValues: {
      market: "",
      outcomes: [],
      category: "",
      openingTime: "",
    },
  });

  const {
    fields: outcomesFields,
    append: appendOutcome,
    remove: removeOutcome,
  } = useFieldArray({ control, name: "outcomes" });

  const addOutcome = () => {
    return appendOutcome({ value: "" });
  };

  const onSubmit = async (values: MarketFormValues) => {
    const outcomes = values.outcomes.map((o) => o.value);

    await createMarket.mutateAsync({
      marketName: values.market,
      encodedQuestion: encodeQuestionText("single-select", values.market, outcomes, values.category, "en_US"),
      outcomes,
      templateId: REALITY_TEMPLATE_SINGLE_SELECT,
      openingTime: Math.round(localTimeToUtc(values.openingTime).getTime() / 1000),
      chainId,
    });
  };

  return (
    <div className="text-center py-10 px-10">
      <div className="text-4xl font-bold mb-5">Create Market</div>

      {!chain && <div className="alert alert-warning">Connect your wallet to a supported network.</div>}

      {createMarket.isError && (
        <div className="alert alert-error mb-5">There was an error while submitting the transaction.</div>
      )}

      {chain && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <div className="font-bold">Market name</div>
            <Input
              autoComplete="off"
              {...register("market", {
                required: "This field is required.",
              })}
              className="w-full md:w-2/3"
              errors={errors}
            />
          </div>

          <div className="space-y-2">
            <div className="font-bold">Category</div>
            <Select
              autoComplete="off"
              {...register("category", {
                required: "This field is required.",
              })}
              options={MARKET_CATEGORIES}
              className="w-full md:w-2/3"
              errors={errors}
            />
          </div>

          <div className="space-y-2">
            <div className="font-bold">Answers</div>

            {outcomesFields.length > 0 && (
              <>
                {outcomesFields.map((outcomeField, i) => {
                  return (
                    <OutcomeFields
                      key={outcomeField.id}
                      outcomeIndex={i}
                      removeOutcome={removeOutcome}
                      errors={errors}
                      register={register}
                    />
                  );
                })}
              </>
            )}

            <div>
              <button type="button" className="btn btn-neutral btn-sm" onClick={addOutcome}>
                Add Option
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-bold">Opening time</div>

            <Input
              autoComplete="off"
              {...register("openingTime", {
                required: "This field is required.",
                validate: (v) => {
                  return (v && new Date(v) > new Date()) || "End date must be in the future";
                },
              })}
              type="datetime-local"
              className="w-full md:w-2/3"
              errors={errors}
            />
          </div>

          <div>
            <Button
              className="btn btn-primary"
              type="submit"
              disabled={!isValid || outcomesFields.length < 2 || createMarket.isPending}
              isLoading={createMarket.isPending}
              text="Create Market"
            />
          </div>
        </form>
      )}
    </div>
  );
}
