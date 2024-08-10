import clsx from "clsx";

interface DropdownProps {
  options: { value: number | string; text: string }[];
  value: number | string | undefined;
  // biome-ignore lint/suspicious/noExplicitAny:
  onClick: (value: any) => void;
  defaultLabel: string;
}

export function Dropdown({ options, value, onClick, defaultLabel }: DropdownProps) {
  return (
    <div className="dropdown simple-dropdown">
      <div tabIndex={0} role="button" className="m-1 text-[14px] text-purple-primary">
        {options.find((option) => option.value === value)?.text ?? defaultLabel}
      </div>
      <ul tabIndex={0} className="shadow p-0 dropdown-content z-[1] rounded-box text-left w-52">
        {options.map((option) => (
          <li
            key={option.value}
            className={clsx(
              "px-[15px] py-[10px]",
              option.value === value && "active border-l-[3px] border-l-purple-primary",
            )}
          >
            <span className="cursor-pointer block" onClick={() => onClick(option.value)}>
              {option.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
