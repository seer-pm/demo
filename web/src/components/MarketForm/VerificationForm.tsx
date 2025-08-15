import { UseFormReturn } from "react-hook-form";
import { OutcomesFormValues } from ".";
import { ImageUpload } from "./Images";

interface OutcomeImageProps {
  outcomeIndex: number;
  outcomeName: string;
  useFormReturn: UseFormReturn<OutcomesFormValues>;
  showOnlyMissingImages: boolean;
}

function OutcomeImage({ outcomeIndex, outcomeName, useFormReturn, showOnlyMissingImages }: OutcomeImageProps) {
  const image = useFormReturn.watch(`outcomes.${outcomeIndex}.image`);

  if (image && showOnlyMissingImages) {
    return null;
  }

  return (
    <div>
      <div className="text-[14px] mb-[10px] text-black-primary line-clamp-1">{outcomeName}</div>
      <ImageUpload
        name={`outcomes.${outcomeIndex}.image`}
        setFile={(file) => useFormReturn.setValue(`outcomes.${outcomeIndex}.image`, file, { shouldValidate: true })}
        control={useFormReturn.control}
        image={image}
        showInfo={false}
      />
    </div>
  );
}

export function VerificationForm({
  useOutcomesFormReturn,
  showOnlyMissingImages,
}: { useOutcomesFormReturn: UseFormReturn<OutcomesFormValues>; showOnlyMissingImages: boolean }) {
  const marketImage = useOutcomesFormReturn.watch("image");
  const outcomes = useOutcomesFormReturn.watch("outcomes");
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px] my-[32px] text-left">
      {(!showOnlyMissingImages || !marketImage) && (
        <div>
          <div className="text-[14px] mb-[10px] text-black-primary">Market</div>
          <ImageUpload
            name="image"
            setFile={(file) => useOutcomesFormReturn.setValue("image", file, { shouldValidate: true })}
            control={useOutcomesFormReturn.control}
            image={marketImage}
            showInfo={false}
          />
        </div>
      )}

      {outcomes.length > 0 &&
        outcomes.map((outcome, i) => {
          return (
            <OutcomeImage
              key={`${outcome.value}_${i}`}
              outcomeIndex={i}
              outcomeName={outcomes[i].value}
              useFormReturn={useOutcomesFormReturn}
              showOnlyMissingImages={showOnlyMissingImages}
            />
          );
        })}
    </div>
  );
}
