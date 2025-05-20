import { ArrowDropDown } from "@/lib/icons";
import clsx from "clsx";
import { ReactNode, useState } from "react";
import DropdownWrapper from "./Form/DropdownWrapper";

interface DropdownProps {
  options: { value: number | string | boolean; text: string; icon?: ReactNode }[];
  value: number | string | boolean | undefined;
  // biome-ignore lint/suspicious/noExplicitAny:
  onClick: (value: any) => void;
  defaultLabel: string;
}

export function Dropdown({ options, value, onClick, defaultLabel }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);
  return (
    <DropdownWrapper
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      className="w-[200px]"
      content={
        <div className="p-2">
          {options.map((option) => (
            <li
              key={option.value.toString()}
              onClick={() => {
                onClick(option.value);
                setIsOpen(false);
              }}
              className={clsx(
                "px-[15px] py-[10px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary flex items-center gap-2 cursor-pointer",
                option.value === value && "active border-l-[3px] border-l-purple-primary bg-purple-medium",
              )}
            >
              {option.icon}
              <span>{option.text}</span>
            </li>
          ))}
        </div>
      }
    >
      <div className="text-[14px] font-semibold cursor-pointer flex items-center whitespace-nowrap">
        {selectedOption?.icon}
        {selectedOption?.text ?? defaultLabel}
        <ArrowDropDown />
      </div>
    </DropdownWrapper>
  );
}
