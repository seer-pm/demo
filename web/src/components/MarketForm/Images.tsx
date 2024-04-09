import { InfoCircleIcon, UploadIcon } from "@/lib/icons";
import { useEffect, useState } from "react";
import Dropzone, { DropzoneProps } from "react-dropzone";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import { DashedBox } from "../DashedBox";
import FormError from "../Form/FormError";

async function getHeightAndWidthFromDataUrl(dataURL: string): Promise<{ height: number; width: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        height: img.height,
        width: img.width,
      });
    };
    img.src = dataURL;
  });
}

export function PreviewImage({ file }: { file: File | undefined }) {
  const [preview, setPreview] = useState<string | undefined>();

  useEffect(() => {
    if (!file) {
      setPreview(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // free memory when ever this component is unmounted
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!file) {
    return null;
  }

  return <img src={preview} className="max-w-full mx-auto" alt="Preview" />;
}

export function ImageUpload<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  onDrop,
  image,
  showInfo = true,
}: {
  name: TName;
  control: Control<TFieldValues>;
  onDrop: DropzoneProps["onDrop"];
  image: File | "";
  showInfo?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      rules={{
        required: false,
        validate: async (v) => {
          if (!v) {
            return true;
          }

          const objectUrl = URL.createObjectURL(v);
          const { width, height } = await getHeightAndWidthFromDataUrl(objectUrl);
          if (width !== height) {
            return "The image aspect ratio must be 1:1.";
          }

          return true;
        },
      }}
      render={({ formState: { errors } }) => (
        <Dropzone onDrop={onDrop} onError={(error: Error) => console.log(error)} accept={{ "image/*": ["svg", "png"] }}>
          {({ getRootProps, getInputProps }) => (
            <div
              {...getRootProps({
                className: "dropzone",
              })}
            >
              <input {...getInputProps()} />
              <DashedBox className="p-[20px] text-center space-y-4">
                <UploadIcon className="mx-auto" />
                {image !== "" && <PreviewImage file={image} />}
              </DashedBox>
              {showInfo && (
                <div className="text-left text-[14px] text-black-secondary flex items-center space-x-2 mt-[16px]">
                  <div>
                    <InfoCircleIcon width="16" height="16" />
                  </div>
                  <span>
                    Add an image cover to illustrate the market - Upload an 1:1 aspect ratio image with transparent
                    background, in SVG, or PNG.
                  </span>
                </div>
              )}
              <FormError errors={errors} name={name} />
            </div>
          )}
        </Dropzone>
      )}
    />
  );
}
