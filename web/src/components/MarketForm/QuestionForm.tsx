import { FormProvider } from "react-hook-form";
import {
  ButtonsWrapper,
  FormStepProps,
  FormWithNextStep,
  FormWithPrevStep,
  MARKET_CATEGORIES,
  QuestionFormValues,
} from ".";
import Input from "../Form/Input";
import Select from "../Form/Select";
import { ImageUpload } from "./Images";

export function QuestionForm({
  useFormReturn,
  goToPrevStep,
  goToNextStep,
}: FormStepProps<QuestionFormValues> & FormWithPrevStep & FormWithNextStep) {
  const {
    register,
    formState: { isValid },
    handleSubmit,
    setValue,
    control,
    watch,
  } = useFormReturn;

  const image = watch("image");

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

        <div>
          <div className="text-[24px] font-semibold mb-[32px]">Category</div>
          <Select
            autoComplete="off"
            {...register("category", {
              required: "This field is required.",
            })}
            options={MARKET_CATEGORIES}
            className="w-full"
            useFormReturn={useFormReturn}
          />
        </div>

        <div className="w-full mx-auto">
          <ImageUpload
            name="image"
            onDrop={(files) => setValue("image", files[0], { shouldValidate: true })}
            control={control}
            image={image}
          />
        </div>

        <ButtonsWrapper goToPrevStep={goToPrevStep} goToNextStep={goToNextStep} disabled={!isValid} />
      </form>
    </FormProvider>
  );
}
