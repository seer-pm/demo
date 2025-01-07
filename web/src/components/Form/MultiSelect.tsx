import clsx from "clsx";
import React, { useState, useRef, useEffect } from "react";
import { UseFormReturn, get } from "react-hook-form";
import FormError from "./FormError";

type MultiSelectProps = {
  // biome-ignore lint/suspicious/noExplicitAny:
  useFormReturn?: UseFormReturn<any>;
  options: { value: string; text: string }[];
  value?: string[];
  onChange?: (values: string[]) => void;
  name?: string;
  className?: string;
  placeholder?: string;
};

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>((props) => {
  const { className, options, useFormReturn, value = [], onChange, name, placeholder = "Select options" } = props;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    formState: { errors, dirtyFields },
  } = useFormReturn || { formState: { errors: undefined, dirtyFields: undefined } };

  const hasError = !!get(errors, name);
  const isValid = !!get(dirtyFields, name) && !hasError;

  const handleCheckboxChange = (optionValue: string) => {
    if (!onChange) return;

    const newValues = value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue];

    onChange(newValues);
    const trigger = useFormReturn?.trigger;
    if (name && trigger) {
      trigger(name);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedText = value.length
    ? options
        .filter((opt) => value.includes(opt.value))
        .map((opt) => opt.text)
        .join(", ")
    : placeholder;

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "select select-bordered bg-white cursor-pointer flex flex-col justify-center w-full",
          className,
          hasError && "border-error-primary",
          isValid && "border-success-primary",
        )}
      >
        <p className="whitespace-nowrap overflow-hidden text-ellipsis">{selectedText}</p>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-black-medium rounded-[1px] shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] max-h-[180px] overflow-auto">
          {options.map((option) => (
            <label key={option.value} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={() => handleCheckboxChange(option.value)}
                className="checkbox checkbox-primary"
              />
              <span>{option.text}</span>
            </label>
          ))}
        </div>
      )}
      <FormError errors={errors} name={name} />
    </div>
  );
});

export default MultiSelect;
