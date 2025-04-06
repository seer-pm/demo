import clsx from "clsx";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  currentOutcome?: string; // Add this prop to track the current outcome
};

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>((props, ref) => {
  const { 
    className, 
    options, 
    useFormReturn, 
    value = [], 
    onChange, 
    name, 
    placeholder = "Select options",
    currentOutcome 
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const {
    formState: { errors, dirtyFields },
  } = useFormReturn || { formState: { errors: undefined, dirtyFields: undefined } };

  const hasError = !!get(errors, name);
  const isValid = !!get(dirtyFields, name) && !hasError;

  const handleCheckboxChange = (optionValue: string) => {
    if (!onChange) return;

    if (currentOutcome && optionValue === currentOutcome) {
      const newValues = value.includes(optionValue) ? value : [...value, optionValue];
      onChange(newValues);
    } else {
      const newValues = value.includes(optionValue) 
        ? value.filter((v) => v !== optionValue) 
        : [...value, optionValue];
      onChange(newValues);
    }

    const trigger = useFormReturn?.trigger;
    if (name && trigger) {
      trigger(name);
    }
  };

  useEffect(() => {
    const updateDropdownPosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener("scroll", updateDropdownPosition);
      window.addEventListener("resize", updateDropdownPosition);
    }

    return () => {
      window.removeEventListener("scroll", updateDropdownPosition);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isOpen]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is inside trigger or dropdown
      const isClickInsideTrigger = triggerRef.current?.contains(event.target as Node);
      const isClickInsideDropdown = document.querySelector(".multi-select-dropdown")?.contains(event.target as Node);

      if (!isClickInsideTrigger && !isClickInsideDropdown) {
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
    <div className="relative w-full">
      <div
        ref={triggerRef}
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

      {isOpen &&
        createPortal(
          <div
            ref={ref}
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
            className="multi-select-dropdown absolute z-[1000] w-full mt-1 bg-white border border-black-medium rounded-[1px] shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] max-h-[180px] overflow-auto"
          >
            {options.map((option) => (
              <label 
                key={option.value} 
                className={clsx(
                  "flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer",
                  currentOutcome && option.value === currentOutcome && "bg-purple-50"
                )}
              >
                <input
                  type="checkbox"
                  checked={value.includes(option.value)}
                  onChange={() => handleCheckboxChange(option.value)}
                  className="checkbox checkbox-primary"
                  disabled={Boolean(currentOutcome && option.value === currentOutcome)} // Disable checkbox for current outcome
                />
                <span>
                  {option.text}
                  {currentOutcome && option.value === currentOutcome && " (Current Outcome)"}
                </span>
              </label>
            ))}          </div>,
          document.body,
        )}
      <FormError errors={errors} name={name} />
    </div>
  );
});

export default MultiSelect;