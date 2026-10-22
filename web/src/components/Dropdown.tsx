import { ArrowDropDown } from "@/lib/icons";
import { ReactNode, useState } from "react";
import DropdownWrapper, { DropdownOption } from "./Form/DropdownWrapper";

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
      direction="auto"
      className="w-[200px]"
      listboxLabel={defaultLabel}
      triggerLabel={selectedOption ? `${defaultLabel}: ${selectedOption.text}` : undefined}
      triggerClassName="rounded-control"
      content={options.map((option) => (
        <DropdownOption
          key={option.value.toString()}
          selected={option.value === value}
          onSelect={() => {
            onClick(option.value);
            setIsOpen(false);
          }}
        >
          {option.icon}
          <span>{option.text}</span>
        </DropdownOption>
      ))}
    >
      <span className="text-[14px] font-semibold cursor-pointer flex items-center whitespace-nowrap">
        {selectedOption?.icon}
        {selectedOption?.text ?? defaultLabel}
        <span className="flex text-[var(--seer-muted)]" aria-hidden="true">
          <ArrowDropDown fill="currentColor" />
        </span>
      </span>
    </DropdownWrapper>
  );
}
