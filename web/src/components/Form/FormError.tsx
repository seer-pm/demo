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
    <div className="mt-2 text-sm text-red-600 dark:text-red-500">
      <ErrorMessage errors={errors} name={name} />
    </div>
  );
}
