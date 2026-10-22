import { useId } from "react";

type TradeSide = "buy" | "sell";

const SIDES: { value: TradeSide; label: string }[] = [
  { value: "buy", label: "Buy" },
  { value: "sell", label: "Sell" },
];

/**
 * The trade direction as a labelled choice. Native radios give arrow-key movement and a single
 * tab stop; the visible segment is drawn from the input's checked and focus states.
 */
export function TradeSideToggle({
  value,
  onChange,
  outcomeText,
}: {
  value: TradeSide;
  onChange: (side: TradeSide) => void;
  outcomeText: string;
}) {
  const name = useId();

  return (
    <fieldset className="grid grid-cols-2 gap-1 rounded-control bg-[var(--seer-surface-raised)] p-1">
      <legend className="sr-only">Buy or sell {outcomeText}</legend>
      {SIDES.map((side) => (
        <label key={side.value} className="relative cursor-pointer">
          <input
            type="radio"
            name={name}
            value={side.value}
            checked={side.value === value}
            onChange={() => onChange(side.value)}
            className="peer sr-only"
          />
          <span className="flex h-9 items-center justify-center rounded-control text-[14px] font-semibold text-[var(--seer-muted)] transition-colors hover:text-[var(--seer-text)] peer-checked:bg-[var(--seer-surface)] peer-checked:text-[var(--seer-accent-text)] peer-checked:shadow-[0_1px_2px_rgb(20_18_35/0.12)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--seer-brand-purple)]">
            {side.label}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
