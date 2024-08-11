import clsx from "clsx";
import React from "react";
import DatePicker from "react-datepicker";
import { Controller, UseFormReturn, get } from "react-hook-form";
import FormError from "./FormError";

import { CalendarHTMLInputIcon } from "@/lib/icons";
import { localTimeToUtc } from "@/lib/utils";
import "react-datepicker/dist/react-datepicker.css";

type InputProps = {
  // biome-ignore lint/suspicious/noExplicitAny:
  useFormReturn?: UseFormReturn<any>;
  helpText?: string;
  icon?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>;

const FormDatePicker = (props: InputProps) => {
  const { className, helpText, icon, useFormReturn, name } = props;
  const {
    formState: { errors, dirtyFields },
    control,
  } = useFormReturn || { formState: { errors: undefined, dirtyFields: undefined }, control: undefined };

  const hasError = !!get(errors, name);
  const isValid = !!get(dirtyFields, name) && !hasError;
  return (
    <>
      <div className="relative">
        {icon && <div className="absolute left-[16px] top-0 bottom-0 flex items-center">{icon}</div>}
        <Controller
          control={control}
          name={name ?? ""}
          rules={{
            required: "This field is required.",
            validate: (v) => {
              return (v && localTimeToUtc(v) > new Date()) || "End date must be in the future";
            },
          }}
          render={({ field }) => (
            <DatePicker
              wrapperClassName={className}
              showTimeSelect
              timeIntervals={15}
              onChange={(date) => field.onChange(date)}
              selected={field.value ? new Date(field.value) : null}
              className={clsx(
                "input input-bordered bg-white focus:outline-purple-primary",
                className,
                icon && "pl-[40px]",
                hasError && "border-error-primary",
                isValid && "border-success-primary",
              )}
              dateFormat="YYYY-MM-dd HH:mm"
              timeFormat="HH:mm"
              placeholderText="YYYY-MM-DD HH:mm"
            />
          )}
        />
        <div className="absolute right-[20px] top-0 bottom-0 flex items-center pointer-events-none">
          <CalendarHTMLInputIcon />
        </div>
      </div>
      {helpText && (
        <p className="text-accent-content text-[12px] mt-2" dangerouslySetInnerHTML={{ __html: helpText }}></p>
      )}
      {hasError && <FormError errors={errors} name={props.name} />}
    </>
  );
};

export default FormDatePicker;
