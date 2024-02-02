import React from "react";
import { FieldErrors } from "react-hook-form";
import FormError from "./FormError";

type InputProps = {
  errors?: FieldErrors;
} & React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement | null, InputProps>((props, ref) => {
  const { className, errors, ...restProps } = props;

  return (
    <>
      <input {...restProps} className={`input input-bordered ${className ?? ""}`} ref={ref} />
      <FormError errors={errors} name={props.name} />
    </>
  );
});

export default Input;
