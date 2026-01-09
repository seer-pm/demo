import clsx from "clsx";
import React from "react";
import { UseFormReturn, get } from "react-hook-form";
import FormError from "./FormError";

type SelectProps = {
  // biome-ignore lint/suspicious/noExplicitAny:
  useFormReturn?: UseFormReturn<any>;
  options: { value: number | string; text: string }[];
} & React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement | null, SelectProps>((props, ref) => {
  const { className, options, useFormReturn, ...restProps } = props;
  const {
    formState: { errors, dirtyFields },
  } = useFormReturn || { formState: { errors: undefined, dirtyFields: undefined } };

  const hasError = !!get(errors, restProps.name);
  const isValid = !!get(dirtyFields, restProps.name) && !hasError;

  return (
    <>
      <select
        {...restProps}
        className={clsx(
          "select select-bordered bg-base-100 focus:outline-purple-primary",
          className,
          hasError && "border-error-primary",
          isValid && "border-success-primary",
        )}
        ref={ref}
      >
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

export default Select;
