import { FormProvider } from "react-hook-form";
import { ButtonsWrapper, DateFormValues, FormStepProps, FormWithNextStep, FormWithPrevStep } from ".";
import Input from "../Form/Input";

export function DateForm({
  useFormReturn,
  goToPrevStep,
  goToNextStep,
}: FormStepProps<DateFormValues> & FormWithPrevStep & FormWithNextStep) {
  const {
    register,
    formState: { errors, isValid },
    handleSubmit,
  } = useFormReturn;

  return (
    <FormProvider {...useFormReturn}>
      <form onSubmit={handleSubmit(goToNextStep)} className="space-y-[32px]">
        <div className="max-w-[450px] mx-auto">
          <div className="text-[24px] font-semibold mb-[32px]">Dates</div>

          <div className="text-[14px] mb-[10px]">Opening Date</div>
          <Input
            autoComplete="off"
            {...register("openingTime", {
              required: "This field is required.",
              validate: (v) => {
                return (v && new Date(v) > new Date()) || "End date must be in the future";
              },
            })}
            type="datetime-local"
            className="w-full"
            errors={errors}
          />
        </div>

        <ButtonsWrapper goToPrevStep={goToPrevStep} goToNextStep={goToNextStep} disabled={!isValid} />
      </form>
    </FormProvider>
  );
}
