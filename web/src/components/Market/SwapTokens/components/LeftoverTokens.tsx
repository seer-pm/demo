import { summarizeLeftovers } from "@/lib/leftovers";
import { displayBalance } from "@/lib/utils";
import type { CompleteSetLeftover } from "@seer-pm/sdk";

/** The leftovers summary, with the full per-token breakdown one click away. */
export function LeftoverTokens({ leftovers, className }: { leftovers: CompleteSetLeftover[]; className?: string }) {
  if (leftovers.length === 0) {
    return null;
  }

  return (
    <details className={className}>
      <summary className="cursor-pointer font-bold">{summarizeLeftovers(leftovers)}</summary>
      <ul className="mt-1 pl-4 list-disc space-y-0.5 font-normal">
        {leftovers.map((leftover) => (
          <li key={leftover.token.address}>
            {displayBalance(leftover.amount, leftover.token.decimals, false)} {leftover.token.symbol}
          </li>
        ))}
      </ul>
    </details>
  );
}
