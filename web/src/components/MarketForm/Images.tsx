import getCroppedImg from "@/lib/crop-image";
import { InfoCircleIcon, UploadIcon } from "@/lib/icons";
import { useEffect, useMemo, useState } from "react";
import Dropzone from "react-dropzone";
import Cropper, { Area } from "react-easy-crop";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import { DashedBox } from "../DashedBox";
import Button from "../Form/Button";
import FormError from "../Form/FormError";
import { useModal } from "../Modal";

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

  return <img src={preview} className="h-[90px] mx-auto" alt="Preview" />;
}

function EditImageModal({
  image,
  setFile,
  closeModal,
}: { image: File; setFile: (file: File) => void; closeModal: () => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = (_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const objectUrl = useMemo(() => URL.createObjectURL(image), [image]);

  const showCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(objectUrl, croppedAreaPixels!, rotation);
      setFile(croppedImage);
      closeModal();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="text-center">
        <div style={{ height: 300 }} className="relative">
          <Cropper
            image={objectUrl}
            crop={crop}
            rotation={rotation}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="space-x-[24px] mt-[32px]">
          <Button text="Return" variant="secondary" type="button" onClick={closeModal} />
          <Button text="Save" variant="primary" type="button" onClick={showCroppedImage} />
        </div>
      </div>
    </div>
  );
}

export function ImageUpload<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  setFile,
  image,
  showInfo = true,
}: {
  name: TName;
  control: Control<TFieldValues>;
  setFile: (file: File) => void;
  image: File | "" | undefined;
  showInfo?: boolean;
}) {
  const { Modal, openModal, closeModal } = useModal("edit-image-modal");

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
        <div>
          <DashedBox className="p-[20px] text-center">
            <Dropzone
              onDrop={(files) => setFile(files[0])}
              onError={(error: Error) => console.log(error)}
              accept={{ "image/png": [], "image/jpeg": [] }}
            >
              {({ getRootProps, getInputProps }) => (
                <div
                  {...getRootProps({
                    className: "dropzone",
                  })}
                >
                  <input {...getInputProps()} />
                  <UploadIcon className="mx-auto" />
                  {!!image && (
                    <div className="my-[16px]">
                      <PreviewImage file={image} />
                    </div>
                  )}
                </div>
              )}
            </Dropzone>

            {!!image && (
              <>
                <Button text="Edit image" className="!px-[10px]" onClick={openModal} size="small" />
                <Modal
                  title="Edit Image"
                  content={<EditImageModal image={image} setFile={setFile} closeModal={closeModal} />}
                />
              </>
            )}
          </DashedBox>
          {showInfo && (
            <div className="text-left text-[14px] text-black-secondary flex items-center space-x-2 mt-[16px]">
              <div>
                <InfoCircleIcon width="16" height="16" />
              </div>
              <span>
                Add an image cover to illustrate the market - Upload a 1:1 aspect ratio PNG or JPEG image. If there is a
                background, it should be transparent.
              </span>
            </div>
          )}
          <FormError errors={errors} name={name} />
        </div>
      )}
    />
  );
}
