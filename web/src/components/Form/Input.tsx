import clsx from "clsx";
import React from "react";
import { UseFormReturn, get } from "react-hook-form";
import FormError from "./FormError";

type InputProps = {
  // biome-ignore lint/suspicious/noExplicitAny:
  useFormReturn?: UseFormReturn<any>;
  helpText?: string;
  icon?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement | null, InputProps>((props, ref) => {
  const { className, helpText, icon, useFormReturn, ...restProps } = props;
  const {
    formState: { errors, dirtyFields },
  } = useFormReturn || { formState: { errors: undefined, dirtyFields: undefined } };

  const hasError = !!get(errors, restProps.name);
  const isValid = !!get(dirtyFields, restProps.name) && !hasError;

  return (
    <>
      <div className="relative">
        {icon && <div className="absolute left-[16px] top-0 bottom-0 flex items-center">{icon}</div>}
        <input
          {...restProps}
          className={clsx(
            "input input-bordered bg-white focus:outline-purple-primary",
            className,
            icon && "pl-[40px]",
            hasError && "border-error-primary",
            isValid && "border-success-primary",
          )}
          ref={ref}
        />
      </div>
      {helpText && <p className="text-accent-content text-[12px] mt-2">{helpText}</p>}
      <FormError errors={errors} name={props.name} />
    </>
  );
});

export default Input;
