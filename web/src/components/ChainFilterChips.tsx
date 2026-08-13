import { SUPPORTED_CHAINS } from "@/lib/chains";
import clsx from "clsx";

export type ChainFilterValue = number | "all";

export function ChainFilterChips({
  value,
  onChange,
  chains,
}: {
  value: ChainFilterValue;
  onChange: (chainId: ChainFilterValue) => void;
  chains?: number[];
}) {
  const ids = chains ?? Object.values(SUPPORTED_CHAINS).map((c) => c.id);
  const chipClass = (active: boolean) =>
    clsx("btn btn-sm", active ? "btn-primary" : "btn-ghost border border-separator-100");

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm text-black-secondary mr-1">Chain</span>
      <button type="button" className={chipClass(value === "all")} onClick={() => onChange("all")}>
        All
      </button>
      {ids.map((id) => (
        <button key={id} type="button" className={chipClass(value === id)} onClick={() => onChange(id)}>
          {SUPPORTED_CHAINS[id as keyof typeof SUPPORTED_CHAINS]?.name ?? id}
        </button>
      ))}
    </div>
  );
}
