import { OUTCOME_PLACEHOLDER } from "@/hooks/useCreateMarket";
import { PlusIcon } from "@/lib/icons";
import { MarketTypes, hasOutcomes } from "@/lib/market";
import { useEffect, useState } from "react";
import { FormProvider, UseFormReturn, useFieldArray } from "react-hook-form";
import { ButtonsWrapper, FormStepProps, FormWithNextStep, FormWithPrevStep, OutcomesFormValues } from ".";
import Button from "../Form/Button";
import Input from "../Form/Input";

interface OutcomeFieldsProps {
  outcomeIndex: number;
  outcomes: OutcomesFormValues["outcomes"];
  outcomesQuestion: string;
  removeOutcome: (i: number) => void;
  useFormReturn: UseFormReturn<OutcomesFormValues>;
}

function OutcomeFields({ outcomeIndex, outcomes, outcomesQuestion, removeOutcome, useFormReturn }: OutcomeFieldsProps) {
  const [showCustomToken, setShowCustomToken] = useState(false);

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
            outcomesQuestion &&
            outcomes[outcomeIndex].value &&
            `Outcome question: ${outcomesQuestion.replace(OUTCOME_PLACEHOLDER, outcomes[outcomeIndex].value)}`
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
            const _showCustomToken = !showCustomToken;
            setShowCustomToken(_showCustomToken);

            if (!_showCustomToken) {
              useFormReturn.setValue(`outcomes.${outcomeIndex}.token`, "", {
                shouldValidate: true,
                shouldDirty: true,
              });
            }
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
  } = useFieldArray({ control, name: "outcomes" });

  useEffect(() => {
    if (outcomesFields.length === 0) {
      addOutcome();
      addOutcome();
    }
  }, []);

  const addOutcome = () => {
    return appendOutcome({ value: "", token: "", image: "" });
  };

  const marketHasOutcomes = hasOutcomes(marketType);

  const [lowerBound, outcomesQuestion, outcomes] = watch(["lowerBound", "outcomesQuestion", "outcomes"]);

  return (
    <FormProvider {...useFormReturn}>
      <form onSubmit={handleSubmit(goToNextStep)} className="space-y-5">
        <div className="space-y-[32px]">
          <div className="text-[24px] font-semibold mb-[32px]">Outcomes</div>

          {marketType === MarketTypes.MULTI_SCALAR && (
            <div className="space-y-2">
              <div className="text-[14px] mb-[10px]">Outcomes question template</div>
              <Input
                autoComplete="off"
                {...register("outcomesQuestion", {
                  required: "This field is required.",
                })}
                className="w-full md:w-2/3"
                useFormReturn={useFormReturn}
                helpText={`Each outcome will have their own question. Use ${OUTCOME_PLACEHOLDER} to replace the outcome value in the question.`}
              />
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
                        outcomesQuestion={outcomesQuestion}
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
                    step="any"
                    min="0"
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
