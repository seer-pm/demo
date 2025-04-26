import { PoolDataResult } from "@algebra/sdk";
import { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";

// Define preset configurations
export const PRESETS = {
  Safe: { downside: 0.2, upside: 0.4 }, // -20%, +40%
  Common: { downside: 0.1, upside: 0.2 }, // -10%, +20%
  Expert: { downside: 0.05, upside: 0.1 }, // -5%, +10%
};
export type PresetName = keyof typeof PRESETS;

// Helper to calculate range for a single config
export const calculateRange = (centerPriceStr: string | number, presetName: PresetName) => {
  // Ensure centerPriceStr is treated as a number
  const center = typeof centerPriceStr === "string" ? Number.parseFloat(centerPriceStr) : centerPriceStr;
  if (Number.isNaN(center) || center < 0 || center > 1) {
    return { minPrice: 0, maxPrice: 1 }; // Default/invalid
  }

  const preset = PRESETS[presetName];
  const calculatedMin = Math.max(0, center * (1 - preset.downside));
  const calculatedMax = Math.min(1, center * (1 + preset.upside));
  return { minPrice: calculatedMin, maxPrice: calculatedMax };
};

// Define the shape of the form data for one outcome
export interface OutcomeFormData {
  independentToken: "quote" | "base";
  quoteAmount: number;
  centerPrice: number;
  minPrice: number;
  maxPrice: number;
  baseAmount: number;
  enabled: boolean;
}

export function isValidLiquidityOutcome(outcome: OutcomeFormData) {
  return (
    outcome.enabled &&
    // at least the independenToken must be defined
    // Check if quoteAmount is a valid non-negative number
    ((outcome.independentToken === "quote" && outcome.quoteAmount > 0) ||
      // Check if baseAmount is a valid non-negative number
      (outcome.independentToken === "base" && outcome.baseAmount > 0)) &&
    // Check centerPrice validity
    outcome.centerPrice >= 0 &&
    outcome.centerPrice <= 1 &&
    // Check minPrice validity
    outcome.minPrice >= 0 &&
    outcome.minPrice < 1 &&
    // Check maxPrice validity
    outcome.maxPrice > 0 &&
    outcome.maxPrice <= 1 &&
    // Ensure minPrice < maxPrice
    outcome.minPrice < outcome.maxPrice
  );
}

// Define the shape of the entire form data
export type LiquidityFormData = {
  outcomes: OutcomeFormData[];
};

// --- Sub-component for configuring a single outcome ---
export interface OutcomeLiquidityConfigProps {
  index: number;
  outcomeName: string;
  control: Control<LiquidityFormData>;
  register: UseFormRegister<LiquidityFormData>;
  errors: FieldErrors<LiquidityFormData>;
  watch: UseFormWatch<LiquidityFormData>;
  setValue: UseFormSetValue<LiquidityFormData>;
  poolData: PoolDataResult;
}
