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
    <div className="flex items-center justify-center gap-6 flex-wrap">
      {goToPrevStep && <Button type="button" variant="secondary" text="Return" onClick={goToPrevStep} />}
      <Button
        type="submit"
        disabled={disabled || isLoading}
        isLoading={isLoading}
        className={isUndefined(goToNextStep) ? "w-[180px]" : ""}
        text={isUndefined(goToNextStep) ? "Create Market" : "Next"}
      />
    </div>
  );
}
