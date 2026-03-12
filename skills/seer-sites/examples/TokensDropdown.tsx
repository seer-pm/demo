import * as React from "react";
import type { Token } from "@seer-pm/sdk";

export interface TokensDropdownProps {
  readonly options: readonly Token[];
  readonly value: Token;
  readonly onSelect: (value: Token) => void;
}

export function TokensDropdown({ options, value, onSelect }: TokensDropdownProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((t) => t.address === value.address);
  const label = selected?.symbol ?? value.symbol;

  if (options.length <= 1) {
    return (
      <div className="px-3 py-1.5 rounded-lg flex items-center cursor-default bg-border-green/50">
        <span className="font-bold text-sm">{label}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="bg-accent-green/10 border border-accent-green/30 px-3 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-accent-green/20 transition-colors"
      >
        <span className="font-bold text-sm text-accent-green">{label}</span>
        <span className="material-symbols-outlined text-sm text-accent-green">expand_more</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" aria-hidden onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-30 py-1 bg-[#1a1a1c] border border-white/10 rounded-custom shadow-xl min-w-[100%]">
            {options.map((token) => (
              <button
                key={token.address}
                type="button"
                onClick={() => {
                  onSelect(token);
                  setOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm font-bold ${
                  value.address === token.address
                    ? "text-accent-green bg-accent-green/10"
                    : "text-gray-300 hover:bg-white/5"
                }`}
              >
                {token.symbol}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default TokensDropdown;

