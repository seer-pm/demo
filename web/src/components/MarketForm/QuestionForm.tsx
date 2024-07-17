import { FormProvider } from "react-hook-form";
import { ButtonsWrapper, FormStepProps, FormWithNextStep, FormWithPrevStep, QuestionFormValues } from ".";
import Input from "../Form/Input";

export function QuestionForm({
  useFormReturn,
  goToPrevStep,
  goToNextStep,
}: FormStepProps<QuestionFormValues> & FormWithPrevStep & FormWithNextStep) {
  const {
    register,
    formState: { isValid },
    handleSubmit,
  } = useFormReturn;

  return (
    <FormProvider {...useFormReturn}>
      <form onSubmit={handleSubmit(goToNextStep)} className="space-y-[32px] md:w-2/3 mx-auto">
        <div>
          <div className="text-[24px] font-semibold mb-[32px]">Question</div>
          <Input
            autoComplete="off"
            {...register("market", {
              required: "This field is required.",
            })}
            className="w-full"
            useFormReturn={useFormReturn}
          />
        </div>

        <ButtonsWrapper goToPrevStep={goToPrevStep} goToNextStep={goToNextStep} disabled={!isValid} />
      </form>
    </FormProvider>
  );
}
