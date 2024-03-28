import { ErrorMessage } from "@hookform/error-message";
import { FieldErrors } from "react-hook-form";

interface FormErrorProps {
  name?: string;
  errors?: FieldErrors;
}

export default function FormError({ name, errors }: FormErrorProps) {
  if (!name || !errors) {
    return null;
  }

  return (
    <div className="my-2 text-sm text-error-primary text-left">
      <ErrorMessage errors={errors} name={name} />
    </div>
  );
}
