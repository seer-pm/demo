import clsx from "clsx";

interface DropdownProps {
  options: { value: number | string; text: string }[];
  value: number | string;
  // biome-ignore lint/suspicious/noExplicitAny:
  onClick: (value: any) => void;
}

export function Dropdown({ options, value, onClick }: DropdownProps) {
  return (
    <div className="dropdown simple-dropdown">
      <div tabIndex={0} role="button" className="m-1 text-[14px] text-purple-primary">
        {options.find((option) => option.value === value)?.text}
      </div>
      <ul tabIndex={0} className="shadow p-0 dropdown-content z-[1] bg-base-100 rounded-box text-left w-52">
        {options.map((option) => (
          <li
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
