import { useMarketRulesPolicy } from "@/hooks/useMarketRulesPolicy";
import { useModal } from "@/hooks/useModal";
import { useTokensInfo } from "@/hooks/useTokenInfo";
import { SupportedChain } from "@/lib/chains";
import { PlusIcon, PolicyIcon } from "@/lib/icons";
import { MarketTypes, hasOutcomes } from "@/lib/market";
import { INVALID_RESULT_OUTCOME_TEXT, isTwoStringsEqual, isUndefined } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { FieldPath, FormProvider, UseFieldArrayReturn, UseFormReturn, useFieldArray } from "react-hook-form";
import { Address, isAddress } from "viem";
import { FormStepProps, FormWithNextStep, FormWithPrevStep, OutcomesFormValues, getQuestionParts } from ".";
import { Alert } from "../Alert";
import Button from "../Form/Button";
import Input from "../Form/Input";
import { ButtonsWrapper } from "./ButtonsWrapper";
import { SearchToken, TokenListItem } from "./SearchToken";

interface OutcomeFieldsProps {
  outcomeIndex: number;
  outcomes: OutcomesFormValues["outcomes"];
  questionStart: string;
  questionEnd: string;
  removeOutcome: (i: number) => void;
  useFormReturn: UseFormReturn<OutcomesFormValues>;
}

function OutcomeField({
  outcomeIndex,
  outcomes,
  questionStart,
  questionEnd,
  removeOutcome,
  useFormReturn,
}: OutcomeFieldsProps) {
  const outcomeName = outcomes[outcomeIndex].value;
  useEffect(() => {
    // trigger validate duplicate outcome names
    if (!outcomeName) return;
    const toTriggerFields = outcomes
      .filter((outcome) => !!outcome.value)
      .map((_, index) => `outcomes.${index}.value`) as `outcomes.${number}.value`[];
    useFormReturn.trigger(toTriggerFields);
  }, [outcomeName]);
  return (
    <div className="text-left">
      <div className="text-[14px] mb-[10px]">Outcome {outcomeIndex + 1}</div>
      <div className="relative">
        <Input
          autoComplete="off"
          {...useFormReturn.register(`outcomes.${outcomeIndex}.value`, {
            required: "This field is required.",
            validate: (v) => {
              if (isTwoStringsEqual(v, INVALID_RESULT_OUTCOME_TEXT)) {
                return "Invalid Outcome.";
              }
              if (outcomes.some((outcome, index) => index !== outcomeIndex && isTwoStringsEqual(v, outcome.value))) {
                return "Duplicated outcome.";
              }
              return true;
            },
          })}
          className="w-full"
          useFormReturn={useFormReturn}
          helpText={
            questionEnd?.trim() &&
            outcomes[outcomeIndex].value &&
            `Outcome question: ${questionStart}${outcomes[outcomeIndex].value}${questionEnd}`
          }
        />

        {outcomeIndex > 1 && (
          <div className="absolute inset-y-2 right-2">
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={() => removeOutcome(outcomeIndex)}
              text="Remove"
            />
          </div>
        )}
      </div>

      <TokenNameField useFormReturn={useFormReturn} fieldName={`outcomes.${outcomeIndex}.token`} />
    </div>
  );
}

interface CollateralFieldsProps {
  collateralNumber: 1 | 2;
  useFormReturn: UseFormReturn<OutcomesFormValues>;
  chainId: SupportedChain;
  searchCollateral: (collateralNumber: 1 | 2) => void;
}

function CollateralField({ collateralNumber, useFormReturn, chainId, searchCollateral }: CollateralFieldsProps) {
  const collateralIndex = collateralNumber - 1;
  const collaterals = useFormReturn.watch(["collateralToken1", "collateralToken2"]);
  const collateral = collaterals[collateralIndex];
  const { data: tokensInfo } = useTokensInfo(collaterals as Address[], chainId);

  useEffect(() => {
    // trigger validate duplicate outcome names
    if (!collateral) return;
    const toTriggerFields = collaterals
      .filter((collateral) => !!collateral)
      .map((_, index) => `collateral.${index + 1}`) as (`collateralToken1` | `collateralToken2`)[];
    useFormReturn.trigger(toTriggerFields);
  }, [collateral]);

  return (
    <div className="text-left">
      <div className="text-[14px] mb-[10px]">Collateral {collateralNumber}</div>
      <div className="relative">
        <Input
          autoComplete="off"
          {...useFormReturn.register(`collateralToken${collateralNumber}`, {
            required: "This field is required.",
            validate: (v) => {
              if (!isAddress(v)) {
                return "Invalid address.";
              }
              if (
                collaterals.some((collateral, index) => index !== collateralIndex && isTwoStringsEqual(v, collateral))
              ) {
                return "Duplicated collateral.";
              }
              return true;
            },
          })}
          className="w-full"
          helpText={
            tokensInfo?.[collateralIndex] &&
            `${tokensInfo[collateralIndex].name} (${tokensInfo[collateralIndex].symbol})`
          }
          useFormReturn={useFormReturn}
        />

        <div className="absolute inset-y-2 right-2">
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={() => searchCollateral(collateralNumber)}
            text="Search"
          />
        </div>
      </div>
    </div>
  );
}

function TokenNameField({
  useFormReturn,
  fieldName,
}: {
  useFormReturn: UseFormReturn<OutcomesFormValues>;
  fieldName: FieldPath<OutcomesFormValues>;
}) {
  const [showCustomToken, setShowCustomToken] = useState(!!useFormReturn.getValues(fieldName));
  const token = useFormReturn.watch(fieldName);
  const outcomes = useFormReturn.getValues("outcomes");
  useEffect(() => {
    if (!showCustomToken) {
      useFormReturn.setValue(fieldName, "", {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [showCustomToken]);
  useEffect(() => {
    // trigger validate duplicate token names
    if (!token) return;
    if (fieldName.includes("outcomes")) {
      const toTriggerFields = outcomes
        .filter((outcome) => !!outcome.token)
        .map((_, index) => `outcomes.${index}.token`) as `outcomes.${number}.token`[];
      useFormReturn.trigger(toTriggerFields);
      return;
    }
    if (fieldName === "upperBound.token") {
      useFormReturn.trigger("lowerBound.token");
      return;
    }
    if (fieldName === "lowerBound.token") {
      useFormReturn.trigger("upperBound.token");
      return;
    }
  }, [token]);
  return (
    <div>
      {showCustomToken && (
        <div>
          <Input
            autoComplete="off"
            {...useFormReturn.register(fieldName, {
              required: "This field is required.",
              validate: (v, formValues) => {
                if (isTwoStringsEqual(v as string, INVALID_RESULT_OUTCOME_TEXT)) {
                  return "Invalid Token Name.";
                }
                if ((v as string).length > 11) {
                  return "Maximum 11 characters.";
                }
                if (
                  (fieldName === "lowerBound.token" && isTwoStringsEqual(v as string, formValues.upperBound.token)) ||
                  (fieldName === "upperBound.token" && isTwoStringsEqual(v as string, formValues.lowerBound.token))
                ) {
                  return "Duplicated token name.";
                }
                if (fieldName.includes("outcomes")) {
                  const outcomeIndex = Number(fieldName.split(".")[1]);
                  if (
                    !Number.isNaN(outcomeIndex) &&
                    formValues.outcomes.some(
                      (outcome, index) => index !== outcomeIndex && isTwoStringsEqual(v as string, outcome.token),
                    )
                  ) {
                    return "Duplicated token name.";
                  }
                }
                return true;
              },
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
  );
}

function OutcomesSection({
  marketHasOutcomes,
  marketName,
  marketType,
  useFormReturn,
  useFieldArrayReturn,
}: {
  marketHasOutcomes: boolean;
  marketName: string;
  marketType: MarketTypes;
  useFormReturn: UseFormReturn<OutcomesFormValues>;
  useFieldArrayReturn: UseFieldArrayReturn<OutcomesFormValues, "outcomes">;
}) {
  const questionParts = getQuestionParts(marketName, marketType);

  const { register, watch } = useFormReturn;

  const [lowerBound, outcomes] = watch(["lowerBound", "outcomes"]);

  const { fields: outcomesFields, append: appendOutcome, remove: removeOutcome } = useFieldArrayReturn;

  const addOutcome = () => {
    return appendOutcome({ value: "", token: "", image: "" }, { shouldFocus: false });
  };

  return (
    <>
      <div className="text-[24px] font-semibold mb-[32px]">Outcomes</div>

      {marketHasOutcomes && (
        <>
          {outcomesFields.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
              {outcomesFields.map((outcomeField, i) => {
                return (
                  <OutcomeField
                    key={outcomeField.id}
                    outcomeIndex={i}
                    removeOutcome={removeOutcome}
                    useFormReturn={useFormReturn}
                    questionStart={questionParts?.questionStart || ""}
                    questionEnd={questionParts?.questionEnd || ""}
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
                {...register("lowerBound.value", {
                  required: "This field is required.",
                  valueAsNumber: true,
                  validate: (v) => {
                    if (Number.isNaN(Number(v)) || Number(v) < 0) {
                      return "Value cannot be negative.";
                    }
                    if (!Number.isInteger(Number(v))) {
                      return "Value must be integer.";
                    }
                    return true;
                  },
                })}
                className="w-full"
                useFormReturn={useFormReturn}
              />
              <TokenNameField useFormReturn={useFormReturn} fieldName="lowerBound.token" />
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
                {...register("upperBound.value", {
                  required: "This field is required.",
                  valueAsNumber: true,
                  validate: (v) => {
                    if (v <= lowerBound.value) {
                      return `Value must be greater than ${lowerBound.value}.`;
                    }
                    if (!Number.isInteger(Number(v))) {
                      return "Value must be integer.";
                    }
                    return true;
                  },
                })}
                className="w-full"
                useFormReturn={useFormReturn}
              />
              <TokenNameField useFormReturn={useFormReturn} fieldName="upperBound.token" />
            </div>
          </div>
          <div className="col-span-1">
            <div className="space-y-2">
              <div className="text-[14px] mb-[10px]">Unit</div>
              <Input
                autoComplete="off"
                type="text"
                {...register("unit")}
                className="w-full"
                useFormReturn={useFormReturn}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CollateralsSection({
  useFormReturn,
  chainId,
}: {
  useFormReturn: UseFormReturn<OutcomesFormValues>;
  chainId: SupportedChain;
}) {
  const activeCollateralNumber = useRef<1 | 2>(1);
  const { Modal, openModal, closeModal } = useModal("collateral-search");

  const searchCollateral = (collateralNumber: 1 | 2) => {
    activeCollateralNumber.current = collateralNumber;
    openModal();
  };

  const selectToken = (token: TokenListItem) => {
    useFormReturn.setValue(`collateralToken${activeCollateralNumber.current}`, token.address);
    window.setTimeout(() => useFormReturn.trigger(["collateralToken1", "collateralToken2"]), 1000);
  };

  return (
    <>
      <div className="text-[24px] font-semibold mb-[32px]">Collateral Tokens</div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
        <CollateralField
          collateralNumber={1}
          useFormReturn={useFormReturn}
          chainId={chainId}
          searchCollateral={searchCollateral}
        />

        <CollateralField
          collateralNumber={2}
          useFormReturn={useFormReturn}
          chainId={chainId}
          searchCollateral={searchCollateral}
        />
      </div>

      <Modal
        title="Select Token"
        content={<SearchToken closeModal={closeModal} selectToken={selectToken} chainId={chainId} />}
      />
    </>
  );
}

export function OutcomesForm({
  useFormReturn,
  goToPrevStep,
  goToNextStep,
  marketType,
  isFutarchyMarket,
  chainId,
}: FormStepProps<OutcomesFormValues> &
  FormWithPrevStep &
  FormWithNextStep & { marketType: MarketTypes; isFutarchyMarket: boolean; chainId: SupportedChain }) {
  const { data: marketRulesPolicy } = useMarketRulesPolicy(chainId as SupportedChain);
  const {
    control,
    register,
    formState: { isValid },
    handleSubmit,
    trigger,
    watch,
  } = useFormReturn;

  const useFieldArrayReturn = useFieldArray({ control, name: "outcomes" });

  const { fields: outcomesFields } = useFieldArrayReturn;

  const [marketName] = watch(["market"]);

  useEffect(() => {
    if (marketName !== "") {
      // revalidate in case we went go to the previous step and changed the market type
      trigger("market");
    }
  }, []);

  const marketHasOutcomes = hasOutcomes(marketType);

  return (
    <FormProvider {...useFormReturn}>
      <form onSubmit={handleSubmit(goToNextStep)} className="space-y-5">
        <div className="space-y-[32px]">
          <div>
            <div className="text-[24px] font-semibold mb-[32px]">
              {isFutarchyMarket ? "Proposal Title" : "Question"}
            </div>
            <Input
              autoComplete="off"
              {...register("market", {
                required: "This field is required.",
                validate: (v) => {
                  if (marketType !== MarketTypes.MULTI_SCALAR) {
                    return true;
                  }

                  if (isUndefined(getQuestionParts(v, marketType))) {
                    return "Invalid question format. The question must include one [outcome type] at the beginning or within the question body.";
                  }

                  return true;
                },
              })}
              className="w-full"
              useFormReturn={useFormReturn}
              helpText={
                marketType === MarketTypes.MULTI_SCALAR
                  ? "Each outcome will have its own question. Place the outcome type in brackets to replace the outcome value in the question. <br />For example: How many electoral votes will the [party name] win in the 2024 U.S. Presidential Election?"
                  : ""
              }
            />
          </div>

          <Alert type="info">
            <div className="space-y-[10px]">
              <p>
                A good question is clear, specific, and unambiguous. For example, instead of asking "Will the economy
                improve?", a better question would be "Will the US GDP growth rate exceed 2.5% in Q4 2024?".
              </p>
              <p>
                Ambiguity is the enemy of effective prediction markets, so strive to eliminate any potential for
                multiple interpretations.
              </p>
              <p>
                Verifiability is crucial for resolving predictions fairly. The question should rely on publicly
                available, trustworthy data sources for resolution. Specify these sources in advance if possible. For
                instance, "According to the Bureau of Labor Statistics' official report, will the US unemployment rate
                be below 4% in December 2024?"
              </p>
              <p>
                This approach ensures that when the resolution date arrives, there's a clear, indisputable way to
                determine the outcome.
              </p>
              <p className="font-medium">
                <a
                  href={marketRulesPolicy}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2"
                >
                  <PolicyIcon /> <span>Read the Market Rules Policy</span>
                </a>
              </p>
            </div>
          </Alert>

          {isFutarchyMarket ? (
            <CollateralsSection useFormReturn={useFormReturn} chainId={chainId} />
          ) : (
            <OutcomesSection {...{ marketHasOutcomes, marketName, marketType, useFormReturn, useFieldArrayReturn }} />
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
