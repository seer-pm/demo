import clsx from "clsx";
import { ReactNode } from "react";

interface DropdownProps {
  options: { value: number | string; text: string; icon?: ReactNode }[];
  value: number | string | undefined;
  // biome-ignore lint/suspicious/noExplicitAny:
  onClick: (value: any) => void;
  defaultLabel: string;
  containerClassName?: string;
  btnClassName?: string;
}

export function Dropdown({
  options,
  value,
  onClick,
  defaultLabel,
  btnClassName: btnClassNameFromProps,
  containerClassName,
}: DropdownProps) {
  const btnClassName = btnClassNameFromProps ?? "m-1 text-[14px] text-purple-primary dropdown-arrow";
  const selectedOption = options.find((option) => option.value === value);
  return (
    <div className={clsx("dropdown simple-dropdown", containerClassName)}>
      <div tabIndex={0} role="button" className={clsx(btnClassName, "flex items-center gap-2 whitespace-nowrap")}>
        {selectedOption?.icon}
        {selectedOption?.text ?? defaultLabel}
      </div>
      <ul tabIndex={0} className="shadow p-0 dropdown-content z-[1] rounded-box text-left w-52">
        {options.map((option) => (
          <li
            key={option.value}
            onClick={() => onClick(option.value)}
            className={clsx(
              "px-[15px] py-[10px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary flex items-center gap-2 cursor-pointer",
              option.value === value && "active border-l-[3px] border-l-purple-primary bg-purple-medium",
            )}
          >
            {option.icon}
            <span>{option.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
