import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

interface OrderTypeOption<T extends string> {
  text: string;
  value: T;
}

interface OrderTypeSelectProps<T extends string> {
  options: OrderTypeOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

// Custom order-type selector ported from ui-fix/market.html (.market-dd):
// a tab-styled trigger with a chevron that rotates 180° on open and a menu
// that fades/slides in, with a check on the selected option.
export function OrderTypeSelect<T extends string>({ options, value, onChange }: OrderTypeSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={clsx("market-dd", open && "open")}>
      <button
        type="button"
        className="market-dd-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <span className="market-dd-label">{selected?.text}</span>
        <svg className="market-dd-chev" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <ul className="market-dd-menu" aria-label="Order type">
        {options.map((option) => (
          <li key={option.value} className="market-dd-opt" data-selected={option.value === value}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span className="opt-name">{option.text}</span>
              <svg className="opt-check" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                  d="M2.5 6L5 8.5L9.5 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
