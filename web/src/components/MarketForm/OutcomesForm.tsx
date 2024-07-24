import { PlusIcon } from "@/lib/icons";
import { MarketTypes, hasOutcomes } from "@/lib/market";
import { useEffect, useState } from "react";
import { FormProvider, UseFormReturn, useFieldArray } from "react-hook-form";
import { ButtonsWrapper, FormStepProps, FormWithNextStep, FormWithPrevStep, OutcomesFormValues } from ".";
import { Alert } from "../Alert";
import Button from "../Form/Button";
import Input from "../Form/Input";

interface OutcomeFieldsProps {
  outcomeIndex: number;
  outcomes: OutcomesFormValues["outcomes"];
  questionStart: string;
  questionFinish: string;
  removeOutcome: (i: number) => void;
  useFormReturn: UseFormReturn<OutcomesFormValues>;
}

function OutcomeFields({
  outcomeIndex,
  outcomes,
  questionStart,
  questionFinish,
  removeOutcome,
  useFormReturn,
}: OutcomeFieldsProps) {
  const [showCustomToken, setShowCustomToken] = useState(false);

  useEffect(() => {
    if (!showCustomToken) {
      useFormReturn.setValue(`outcomes.${outcomeIndex}.token`, "", {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [showCustomToken]);

  return (
    <div className="text-left">
      <div className="text-[14px] mb-[10px]">Outcome {outcomeIndex + 1}</div>
      <div className="relative">
        <Input
          autoComplete="off"
          {...useFormReturn.register(`outcomes.${outcomeIndex}.value`, {
            required: "This field is required.",
          })}
          className="w-full"
          useFormReturn={useFormReturn}
          helpText={
            questionStart &&
            questionFinish &&
            outcomes[outcomeIndex].value &&
            `Outcome question: ${questionStart} ${outcomes[outcomeIndex].value} ${questionFinish}`
          }
        />

        <div className="absolute inset-y-2 right-2">
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={() => removeOutcome(outcomeIndex)}
            text="Remove"
          />
        </div>
      </div>

      <div>
        {showCustomToken && (
          <div>
            <Input
              autoComplete="off"
              {...useFormReturn.register(`outcomes.${outcomeIndex}.token`, {
                required: "This field is required.",
              })}
              className="w-full"
              useFormReturn={useFormReturn}
            />
          </div>
        )}
        <div
          className="text-purple-primary text-[12px] cursor-pointer mb-[5px]"
          onClick={() => {
            setShowCustomToken(!showCustomToken);
          }}
        >
          {showCustomToken ? "Use default token name" : "Set custom token name"}
        </div>
      </div>
    </div>
  );
}

export function OutcomesForm({
  useFormReturn,
  goToPrevStep,
  goToNextStep,
  marketType,
}: FormStepProps<OutcomesFormValues> & FormWithPrevStep & FormWithNextStep & { marketType: MarketTypes }) {
  const {
    control,
    register,
    formState: { isValid },
    handleSubmit,
    watch,
  } = useFormReturn;

  const {
    fields: outcomesFields,
    append: appendOutcome,
    remove: removeOutcome,
    prepend: prependOutcome,
  } = useFieldArray({ control, name: "outcomes" });

  useEffect(() => {
    if (outcomesFields.length === 0) {
      addToStartOutcome();
      addToStartOutcome();
    }
  }, []);

  const addOutcome = () => {
    return appendOutcome({ value: "", token: "", image: "" });
  };
  const addToStartOutcome = () => {
    return prependOutcome({ value: "", token: "", image: "" });
  };

  const marketHasOutcomes = hasOutcomes(marketType);

  const [lowerBound, questionStart, questionFinish, outcomes] = watch([
    "lowerBound",
    "questionStart",
    "questionFinish",
    "outcomes",
  ]);

  return (
    <FormProvider {...useFormReturn}>
      <form onSubmit={handleSubmit(goToNextStep)} className="space-y-5">
        <div className="space-y-[32px]">
          <div className="text-[24px] font-semibold mb-[32px]">Outcomes</div>

          {marketType === MarketTypes.MULTI_SCALAR && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
              <div className="space-y-2">
                <div className="text-[14px] mb-[10px]">Question start</div>
                <Input
                  autoComplete="off"
                  {...register("questionStart", {
                    required: "This field is required.",
                  })}
                  className="w-full"
                  useFormReturn={useFormReturn}
                />
              </div>
              <div className="space-y-2">
                <div className="text-[14px] mb-[10px]">Question finish</div>
                <Input
                  autoComplete="off"
                  {...register("questionFinish", {
                    required: "This field is required.",
                  })}
                  className="w-full"
                  useFormReturn={useFormReturn}
                />
              </div>
              <div className="col-span-2">
                <Alert type="info">
                  <div className="space-y-[5px]">
                    <p>Each outcome question will be formed by combining the following strings:</p>
                    <p className="font-medium">[QUESTION_START] [OUTCOME] [QUESTION_FINISH]</p>
                    <p>You can review the resulting question for each outcome below.</p>
                  </div>
                </Alert>
              </div>
            </div>
          )}

          {marketHasOutcomes && (
            <>
              {outcomesFields.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
                  {outcomesFields.map((outcomeField, i) => {
                    return (
                      <OutcomeFields
                        key={outcomeField.id}
                        outcomeIndex={i}
                        removeOutcome={removeOutcome}
                        useFormReturn={useFormReturn}
                        questionStart={questionStart}
                        questionFinish={questionFinish}
                        outcomes={outcomes}
                      />
                    );
                  })}
                </div>
              )}

              <div className="text-left">
                <button type="button" onClick={addOutcome}>
                  <PlusIcon />
                </button>
              </div>
            </>
          )}

          {marketType === MarketTypes.SCALAR && (
            <div className="grid grid-cols-5 gap-4 w-full max-w-[782px] mx-auto text-left">
              <div className="col-span-2">
                <div className="space-y-2">
                  <div className="text-[14px] mb-[10px]">Lower Range (≤ than)</div>
                  <Input
                    autoComplete="off"
                    type="number"
                    min="0"
                    step="any"
                    {...register("lowerBound", {
                      required: "This field is required.",
                      valueAsNumber: true,
                      validate: (v) => {
                        if (Number.isNaN(Number(v)) || Number(v) < 0) {
                          return "Value cannot be negative.";
                        }

                        return true;
                      },
                    })}
                    className="w-full"
                    useFormReturn={useFormReturn}
                  />
                </div>
              </div>
              <div className="col-span-2">
                <div className="space-y-2">
                  <div className="text-[14px] mb-[10px]">Upper Range (≥ than)</div>
                  <Input
                    autoComplete="off"
                    type="number"
                    min="0"
                    step="any"
                    {...register("upperBound", {
                      required: "This field is required.",
                      valueAsNumber: true,
                      validate: (v) => {
                        if (v <= lowerBound) {
                          return `Value must be greater than ${lowerBound}.`;
                        }

                        return true;
                      },
                    })}
                    className="w-full"
                    useFormReturn={useFormReturn}
                  />
                </div>
              </div>
              <div className="col-span-1">
                <div className="space-y-2">
                  <div className="text-[14px] mb-[10px]">Unit</div>
                  <Input
                    autoComplete="off"
                    type="text"
                    {...register("unit", {
                      required: "This field is required.",
                    })}
                    className="w-full"
                    useFormReturn={useFormReturn}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <ButtonsWrapper
          goToPrevStep={goToPrevStep}
          goToNextStep={goToNextStep}
          disabled={!isValid || (marketHasOutcomes && outcomesFields.length < 2)}
        />
      </form>
    </FormProvider>
  );
}
