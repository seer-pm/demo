import clsx from "clsx";
import React from "react";
import { UseFormReturn, get } from "react-hook-form";
import FormError from "./FormError";

type TextareaProps = {
  // biome-ignore lint/suspicious/noExplicitAny:
  useFormReturn?: UseFormReturn<any>;
  helpText?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement | null, TextareaProps>((props, ref) => {
  const { className, helpText, useFormReturn, ...restProps } = props;
  const {
    formState: { errors, dirtyFields },
  } = useFormReturn || { formState: { errors: undefined, dirtyFields: undefined } };

  const hasError = !!get(errors, restProps.name);
  const isValid = !!get(dirtyFields, restProps.name) && !hasError;
  return (
    <>
      <div className="relative">
        <textarea
          {...restProps}
          className={clsx(
            "textarea textarea-bordered bg-base-100 focus:outline-purple-primary",
            className,
            hasError && "border-error-primary",
            isValid && "border-success-primary",
          )}
          ref={ref}
        />
      </div>
      {helpText && (
        <p className="text-accent-content text-[12px] mt-2" dangerouslySetInnerHTML={{ __html: helpText }}></p>
      )}

      <FormError errors={errors} name={props.name} />
    </>
  );
});

export default Textarea;
