import Button from "@/components/Form/Button";
import { isUndefined } from "@/lib/utils";
import { FormWithNextStep, FormWithPrevStep } from "./index.tsx";

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
