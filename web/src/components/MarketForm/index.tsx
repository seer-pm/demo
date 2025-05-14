import { MarketTypes } from "@/lib/market";
import { FieldValues, UseFormReturn } from "react-hook-form";

export const MISC_CATEGORY = "misc";
export const WEATHER_CATEGORY = "weather";

export const MARKET_CATEGORIES: { value: string; text: string }[] = [
  { value: "elections", text: "Elections" },
  { value: "politics", text: "Politics" },
  { value: "business", text: "Business" },
  { value: "science", text: "Science" },
  { value: "crypto", text: "Crypto" },
  { value: "pop_culture", text: "Pop Culture" },
  { value: "sports", text: "Sports" },
  { value: "doge", text: "DOGE" },
  { value: MISC_CATEGORY, text: "Miscellaneous" },
  { value: WEATHER_CATEGORY, text: "Weather" },
];

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
  marketCategories: string[];
};

export type OutcomesFormValues = {
  market: string;
  image: File;
  outcomes: { value: string; token: string; image: File | "" }[]; // for categorical and multi scalar markets
  lowerBound: { value: number; token: string }; // for scalar markets
  upperBound: { value: number; token: string }; // for scalar markets
  unit: string; // for scalar markets
};

export interface DateFormValues {
  openingTime: string;
}
