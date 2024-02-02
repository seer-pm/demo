import React from "react";
import { FieldErrors } from "react-hook-form";
import FormError from "./FormError";

type InputProps = {
  errors?: FieldErrors;
  options: { value: number | string; text: string }[];
} & React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement | null, InputProps>((props, ref) => {
  const { className, errors, options, ...restProps } = props;

  return (
    <>
      <select {...restProps} className={`select select-bordered ${className ?? ""}`} ref={ref}>
        <option value=""></option>
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.text}
          </option>
        ))}
      </select>
      <FormError errors={errors} name={props.name} />
    </>
  );
});

export default Input;
