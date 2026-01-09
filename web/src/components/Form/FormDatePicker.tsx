import clsx from "clsx";
import React from "react";
import DatePicker from "react-datepicker";
import { Controller, UseFormReturn, get } from "react-hook-form";
import FormError from "./FormError";

import { utcToLocalTime } from "@/lib/date";
import { CalendarHTMLInputIcon } from "@/lib/icons";
import "react-datepicker/dist/react-datepicker.css";
import { Alert } from "../Alert";

type InputProps = {
  // biome-ignore lint/suspicious/noExplicitAny:
  useFormReturn: UseFormReturn<any>;
  helpText?: string;
  icon?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>;

const FormDatePicker = (props: InputProps) => {
  const { className, helpText, icon, useFormReturn, name } = props;
  const {
    formState: { errors, dirtyFields },
    control,
    watch,
  } = useFormReturn || { formState: { errors: undefined, dirtyFields: undefined }, control: undefined };

  const hasError = !!get(errors, name);
  const isValid = !!get(dirtyFields, name) && !hasError;
  const value = watch(name ?? "");
  return (
    <>
      <div className="relative">
        {icon && <div className="absolute left-[16px] top-0 bottom-0 flex items-center">{icon}</div>}
        <Controller
          control={control}
          name={name ?? ""}
          rules={{
            required: "This field is required.",
          }}
          render={({ field }) => (
            <DatePicker
              wrapperClassName={className}
              showTimeSelect
              timeIntervals={15}
              onChange={(date) => field.onChange(date)}
              selected={field.value ? new Date(field.value) : null}
              className={clsx(
                "input input-bordered bg-base-100 focus:outline-purple-primary",
                className,
                icon && "pl-[40px]",
                hasError && "border-error-primary",
                isValid && "border-success-primary",
              )}
              dateFormat="yyyy-MM-dd HH:mm"
              dateFormatCalendar="MMMM"
              timeFormat="HH:mm"
              placeholderText="yyyy-MM-dd HH:mm"
              calendarClassName="custom-date-picker"
              showYearDropdown
              dropdownMode="select"
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
      {value && utcToLocalTime(value) <= new Date() && (
        <Alert type="warning" className="my-2 text-sm">
          <p className="text-[14px]">
            The opening date is in the past, it will be possible to try to resolve this market as soon as it is created.
          </p>
        </Alert>
      )}
    </>
  );
};

export default FormDatePicker;
