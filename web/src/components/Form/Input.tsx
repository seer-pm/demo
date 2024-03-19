import clsx from "clsx";
import React from "react";
import { FieldErrors } from "react-hook-form";
import FormError from "./FormError";

type InputProps = {
  errors?: FieldErrors;
  helpText?: string;
  icon?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement | null, InputProps>((props, ref) => {
  const { className, errors, helpText, icon, ...restProps } = props;

  return (
    <>
      <div className="relative">
        {icon && <div className="absolute left-[16px] top-0 bottom-0 flex items-center">{icon}</div>}
        <input {...restProps} className={clsx("input input-bordered", className, icon && "pl-[40px]")} ref={ref} />
      </div>
      {helpText && <p className="text-accent-content text-[12px] mt-2">{helpText}</p>}
      <FormError errors={errors} name={props.name} />
    </>
  );
});

export default Input;
