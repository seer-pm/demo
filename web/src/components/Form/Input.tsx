import React from "react";
import { FieldErrors } from "react-hook-form";
import FormError from "./FormError";

type InputProps = {
  errors?: FieldErrors;
  helpText?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement | null, InputProps>((props, ref) => {
  const { className, errors, helpText, ...restProps } = props;

  return (
    <>
      <input {...restProps} className={`input input-bordered ${className ?? ""}`} ref={ref} />
      {helpText && <p className="text-accent-content mt-2">{helpText}</p>}
      <FormError errors={errors} name={props.name} />
    </>
  );
});

export default Input;
