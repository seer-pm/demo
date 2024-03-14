import Button from "@/components/Form/Button";
import { MarketTypes } from "@/hooks/useCreateMarket";
import { isUndefined } from "@/lib/utils";
import { FieldValues, UseFormReturn } from "react-hook-form";

export const MARKET_CATEGORIES: { value: string; text: string }[] = [
  { value: "sports", text: "Sports" },
  { value: "technology", text: "Technology" },
  { value: "politics", text: "Politics" },
  { value: "misc", text: "Miscellaneous" },
];

export function ButtonsWrapper({
  goToPrevStep,
  goToNextStep,
  disabled,
  isLoading = false,
}: {
  goToPrevStep?: FormWithPrevStep["goToPrevStep"];
  goToNextStep?: FormWithNextStep["goToNextStep"];
  disabled?: boolean;
  isLoading?: boolean;
}) {
  return (
    <div className="space-x-[24px]">
      {goToPrevStep && <Button type="button" variant="secondary" text="Return" onClick={goToPrevStep} />}
      <Button
        type="submit"
        disabled={disabled || isLoading}
        isLoading={isLoading}
        text={isUndefined(goToNextStep) ? "Create Market" : "Next"}
      />
    </div>
  );
}

export interface FormStepProps<T extends FieldValues> {
  useFormReturn: UseFormReturn<T>;
}

export interface FormWithPrevStep {
  goToPrevStep: () => void;
}

export interface FormWithNextStep {
  goToNextStep: () => void;
}

export type MarketTypeFormValues = {
  marketType: MarketTypes;
};

export type QuestionFormValues = {
  market: string;
  category: string;
};

export type OutcomesFormValues = {
  outcomes: { value: string; token: string }[]; // for categorical and multi scalar markets
  outcomesQuestion: string; // for multi scalar markets
  lowerBound: number; // for scalar markets
  upperBound: number; // for scalar markets
  unit: string; // for scalar markets
};

export interface DateFormValues {
  openingTime: string;
}
