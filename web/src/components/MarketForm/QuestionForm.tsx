import { PolicyIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { FormProvider } from "react-hook-form";
import { ButtonsWrapper, FormStepProps, FormWithNextStep, FormWithPrevStep, QuestionFormValues } from ".";
import { Alert } from "../Alert";
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

        <Alert type="info">
          <div className="space-y-[10px]">
            <p>
              A good question is clear, specific, and unambiguous. For example, instead of asking "Will the economy
              improve?", a better question would be "Will the US GDP growth rate exceed 2.5% in Q4 2024?".
            </p>
            <p>
              Ambiguity is the enemy of effective prediction markets, so strive to eliminate any potential for multiple
              interpretations.
            </p>
            <p>
              Verifiability is crucial for resolving predictions fairly. The question should rely on publicly available,
              trustworthy data sources for resolution. Specify these sources in advance if possible. For instance,
              "According to the Bureau of Labor Statistics' official report, will the US unemployment rate be below 4%
              in December 2024?"
            </p>
            <p>
              This approach ensures that when the resolution date arrives, there's a clear, indisputable way to
              determine the outcome.
            </p>
            <p className="font-medium">
              <a
                href={paths.marketRulesPolicy()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2"
              >
                <PolicyIcon /> <span>Read the Market Rules Policy</span>
              </a>
            </p>
          </div>
        </Alert>

        <ButtonsWrapper goToPrevStep={goToPrevStep} goToNextStep={goToNextStep} disabled={!isValid} />
      </form>
    </FormProvider>
  );
}
