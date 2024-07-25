import { FormProvider } from "react-hook-form";
import { ButtonsWrapper, DateFormValues, FormStepProps, FormWithNextStep, FormWithPrevStep } from ".";
import { Alert } from "../Alert";

import "react-datepicker/dist/react-datepicker.css";
import FormDatePicker from "../Form/FormDatePicker";

export function DateForm({
  useFormReturn,
  goToPrevStep,
  goToNextStep,
}: FormStepProps<DateFormValues> & FormWithPrevStep & FormWithNextStep) {
  const {
    formState: { isValid },
    handleSubmit,
  } = useFormReturn;
  return (
    <FormProvider {...useFormReturn}>
      <form onSubmit={handleSubmit(goToNextStep)} className="space-y-[32px]">
        <div className="text-[24px] font-semibold mb-[32px]">Dates</div>

        <Alert type="info">
          <div className="space-y-[10px]">
            <p>The opening date is the date where people can start answering the question on reality.eth.</p>
            <p>
              If by the opening date the answer is not known and there is reasonable expectation for it to be known in
              the future, people should counter any answer by the "Answered too soon" option which will delay the
              resolution of the market until the answer can be known.
            </p>
            <p>
              If at the resolution time there is no known answer and there is no reasonable expectation that the answer
              will be known in the future, the market will resolve to the "Invalid" option.
            </p>
          </div>
        </Alert>

        <div className="max-w-[450px] mx-auto">
          <div className="text-[14px] mb-[10px]">Opening Date (UTC Time)</div>

          <FormDatePicker name={"openingTime"} className="w-full" useFormReturn={useFormReturn} />
        </div>

        <ButtonsWrapper goToPrevStep={goToPrevStep} goToNextStep={goToNextStep} disabled={!isValid} />
      </form>
    </FormProvider>
  );
}
