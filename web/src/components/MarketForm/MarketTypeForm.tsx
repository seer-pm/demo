import { MarketTypes } from "@/hooks/useCreateMarket";
import { FormProvider } from "react-hook-form";
import { ButtonsWrapper, FormStepProps, FormWithNextStep, MarketTypeFormValues } from ".";
import Select from "../Form/Select";

export function MarketTypeForm({
  useFormReturn,
  goToNextStep,
}: FormStepProps<MarketTypeFormValues> & FormWithNextStep) {
  const {
    register,
    formState: { errors, isValid },
    handleSubmit,
  } = useFormReturn;

  const MARKET_TYPES_OPTIONS = [
    { value: MarketTypes.CATEGORICAL, text: "Categorical" },
    { value: MarketTypes.SCALAR, text: "Scalar" },
    { value: MarketTypes.MULTI_SCALAR, text: "Multi Scalar" },
  ];

  return (
    <FormProvider {...useFormReturn}>
      <form onSubmit={handleSubmit(goToNextStep)} className="space-y-[32px]">
        <div>
          <div className="text-[24px] font-semibold mb-[32px]">Type</div>
          <Select
            options={MARKET_TYPES_OPTIONS}
            {...register("marketType", {
              required: "This field is required.",
              valueAsNumber: true,
            })}
            className="w-full md:w-2/3"
            errors={errors}
          />
        </div>

        <ButtonsWrapper goToNextStep={goToNextStep} disabled={!isValid} />
      </form>
    </FormProvider>
  );
}
