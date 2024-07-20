import { MarketTypes } from "@/lib/market";
import { FormProvider } from "react-hook-form";
import { ButtonsWrapper, FormStepProps, FormWithNextStep, MarketTypeFormValues } from ".";
import { Alert } from "../Alert";
import Select from "../Form/Select";

const MARKETS_DESCRIPTIONS = {
  [MarketTypes.CATEGORICAL]: `<p>Questions with one specific answer.</p>
  <p class="font-medium">Example: Which party wins 2024 US Presidential Election?</p>`,
  [MarketTypes.SCALAR]: `<p>Questions with two outcomes that represent a minimum (“lower”) and a maxim (“upper”) range of a continuous scale, where the answer is represented by a numerical value that can fall either within or outside the margins determined by the outcomes.</p>
  <p class="font-medium">Example: What will ETH/USD price be at the end of December 2024?</p>`,
  [MarketTypes.MULTI_CATEGORICAL]: `<p>Questions that may have more than one answer.</p>
  <p class="font-medium">Example: Which countries will win the most medals at the 2024 Paris Olympics?</p>`,
  [MarketTypes.MULTI_SCALAR]: `<p>Questions with outcomes that are measured on multiple continuous scales, where each outcome has its own question and an answer represented by a numerical value.</p>
  <p class="font-medium">Example: How many seats will each group get in the EU elections?</p>`,
};

export function MarketTypeForm({
  useFormReturn,
  goToNextStep,
}: FormStepProps<MarketTypeFormValues> & FormWithNextStep) {
  const {
    register,
    formState: { isValid },
    handleSubmit,
    watch,
  } = useFormReturn;

  const MARKET_TYPES_OPTIONS = [
    { value: "", text: "" },
    { value: MarketTypes.CATEGORICAL, text: "Categorical" },
    { value: MarketTypes.SCALAR, text: "Scalar" },
    { value: MarketTypes.MULTI_CATEGORICAL, text: "Multi Categorical" },
    { value: MarketTypes.MULTI_SCALAR, text: "Multi Scalar" },
  ];

  const marketType = watch("marketType");

  return (
    <FormProvider {...useFormReturn}>
      <form onSubmit={handleSubmit(goToNextStep)} className="space-y-[32px] md:w-2/3 mx-auto">
        <div>
          <div className="text-[24px] font-semibold mb-[32px]">Type</div>
          <Select
            options={MARKET_TYPES_OPTIONS}
            {...register("marketType", {
              required: "This field is required.",
            })}
            className="w-full"
            useFormReturn={useFormReturn}
          />
        </div>

        {MARKETS_DESCRIPTIONS[marketType] && (
          <Alert type="info">
            <div
              dangerouslySetInnerHTML={{ __html: MARKETS_DESCRIPTIONS[marketType] }}
              className="space-y-[10px]"
            ></div>
          </Alert>
        )}

        <ButtonsWrapper goToNextStep={goToNextStep} disabled={!isValid} />
      </form>
    </FormProvider>
  );
}
