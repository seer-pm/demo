import { MarketTypes } from "@/lib/market";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { Address } from "viem";

export const MISC_CATEGORY = "misc";

export function getQuestionParts(
  marketName: string,
  marketType: MarketTypes,
): { questionStart: string; questionEnd: string; outcomeType: string } | undefined {
  if (marketType !== MarketTypes.MULTI_SCALAR) {
    return { questionStart: "", questionEnd: "", outcomeType: "" };
  }

  // splits the question, for example
  // How many electoral votes will the [party name] win in the 2024 U.S. Presidential Election?
  const parts = marketName.split(/\[|\]/);

  if (parts.length !== 3) {
    return;
  }

  // prevent this case ]outcome type[
  if (marketName.indexOf("[") > marketName.indexOf("]")) {
    return;
  }

  const [questionStart, outcomeType, questionEnd] = parts;
  if (!questionEnd?.trim() || !outcomeType.trim()) {
    return;
  }

  return { questionStart, questionEnd, outcomeType };
}

interface GetImagesReturn {
  url: {
    market: string;
    outcomes: string[];
  };
  file: {
    market: File;
    outcomes: File[];
  };
}

export function getImagesForVerification(outcomesValues: OutcomesFormValues): GetImagesReturn | false {
  if (!outcomesValues.image) {
    return false;
  }

  let outcomesFiles: File[] = [];

  const allOutcomesWithImages = outcomesValues.outcomes.every((o) => o.image instanceof File);

  if (!allOutcomesWithImages) {
    return false;
  }

  outcomesFiles = outcomesValues.outcomes.map((i) => i.image as File);

  return {
    url: {
      market: URL.createObjectURL(outcomesValues.image),
      outcomes: outcomesFiles.map((f) => URL.createObjectURL(f)),
    },
    file: {
      market: outcomesValues.image,
      outcomes: outcomesFiles,
    },
  };
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

export type OutcomesFormValues = {
  market: string;
  image: File | "";
  outcomes: { value: string; token: string; image: File | "" }[]; // for categorical and multi scalar markets
  collateralToken1: Address | ""; // for futarchy markets
  collateralToken2: Address | ""; // for futarchy markets
  lowerBound: { value: number; token: string }; // for scalar markets
  upperBound: { value: number; token: string }; // for scalar markets
  unit: string; // for scalar markets
};

export type DateFormValues = {
  openingTime: string;
};
