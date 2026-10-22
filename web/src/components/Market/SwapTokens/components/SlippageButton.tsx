import { Parameter } from "@/lib/icons";

/** Opens the max slippage settings. The current value is part of the label so it stays visible. */
export function SlippageButton({ maxSlippage, onClick }: { maxSlippage: string | number; onClick: () => void }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-[var(--seer-muted)]">
      <span>Max slippage</span>
      <button
        type="button"
        onClick={onClick}
        aria-label={`Max slippage ${maxSlippage}%. Change`}
        className="inline-flex min-h-6 items-center gap-1.5 rounded-control px-1 font-semibold text-[var(--seer-accent-text)] hover:bg-[var(--seer-accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--seer-brand-purple)]"
      >
        {maxSlippage}%
        <Parameter width="14px" height="14px" fill="currentColor" />
      </button>
    </div>
  );
}
