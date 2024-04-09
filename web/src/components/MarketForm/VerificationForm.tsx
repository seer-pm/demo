import { UseFormReturn } from "react-hook-form";
import { OutcomesFormValues, QuestionFormValues } from ".";
import { ImageUpload } from "./Images";

interface OutcomeImageProps {
  outcomeIndex: number;
  useFormReturn: UseFormReturn<OutcomesFormValues>;
}

function OutcomeImage({ outcomeIndex, useFormReturn }: OutcomeImageProps) {
  const image = useFormReturn.watch(`outcomes.${outcomeIndex}.image`);

  if (image) {
    return null;
  }

  return (
    <div>
      <div className="text-[14px] mb-[10px] text-black-primary">Outcome {outcomeIndex + 1}</div>
      <ImageUpload
        name={`outcomes.${outcomeIndex}.image`}
        onDrop={(files) => useFormReturn.setValue(`outcomes.${outcomeIndex}.image`, files[0], { shouldValidate: true })}
        control={useFormReturn.control}
        image={image}
        showInfo={false}
      />
    </div>
  );
}

export function VerificationForm({
  useQuestionFormReturn,
  useOutcomesFormReturn,
}: {
  useQuestionFormReturn: UseFormReturn<QuestionFormValues>;
  useOutcomesFormReturn: UseFormReturn<OutcomesFormValues>;
}) {
  const marketImage = useQuestionFormReturn.watch("image");
  const outcomes = useOutcomesFormReturn.watch("outcomes");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px] my-[32px] text-left">
      {!marketImage && (
        <div>
          <div className="text-[14px] mb-[10px] text-black-primary">Market</div>
          <ImageUpload
            name="image"
            onDrop={(files) => useQuestionFormReturn.setValue("image", files[0], { shouldValidate: true })}
            control={useQuestionFormReturn.control}
            image={marketImage}
            showInfo={false}
          />
        </div>
      )}

      {outcomes.length > 0 &&
        outcomes.map((outcome, i) => {
          return <OutcomeImage key={`${outcome.value}_${i}`} outcomeIndex={i} useFormReturn={useOutcomesFormReturn} />;
        })}
    </div>
  );
}
