import React from "react";
import { FieldErrors } from "react-hook-form";
import FormError from "./FormError";

type InputProps = {
  errors?: FieldErrors;
} & React.InputHTMLAttributes<HTMLInputElement>;

const Toggle = React.forwardRef<HTMLInputElement | null, InputProps>((props, ref) => {
  const { className, errors, ...restProps } = props;

  return (
    <>
      <input {...restProps} type="checkbox" className={`toggle toggle-md ${className ?? ""}`} ref={ref} />
      <FormError errors={errors} name={props.name} />
    </>
  );
});

export default Toggle;
