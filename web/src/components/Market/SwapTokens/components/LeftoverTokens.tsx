import { summarizeLeftovers } from "@/lib/leftovers";
import { displayBalance } from "@/lib/utils";
import type { CompleteSetLeftover } from "@seer-pm/sdk";
import clsx from "clsx";

function LeftoverList({ leftovers, className }: { leftovers: CompleteSetLeftover[]; className?: string }) {
  return (
    <ul className={clsx("pl-4 list-disc space-y-0.5 font-normal", className)}>
      {leftovers.map((leftover) => (
        <li key={leftover.token.address}>
          {displayBalance(leftover.amount, leftover.token.decimals, false)} {leftover.token.symbol}
        </li>
      ))}
    </ul>
  );
}

/**
 * The leftovers summary, with the full per-token breakdown one click away.
 *
 * `inline` makes the summary sentence itself the toggle, so it can sit mid-sentence. `block` sets
 * the sentence as its own paragraph and puts the toggle on a short line under it: the sentence
 * runs long on a market with many outcomes, and a toggle marker glued to its first word is lost
 * once it wraps.
 */
export function LeftoverTokens({
  leftovers,
  marketId,
  className,
  layout = "inline",
}: {
  leftovers: CompleteSetLeftover[];
  /** The market being traded, whose leftovers are told apart from those of its ancestors. */
  marketId: string;
  className?: string;
  layout?: "inline" | "block";
}) {
  if (leftovers.length === 0) {
    return null;
  }

  const summary = summarizeLeftovers(leftovers, marketId);

  if (layout === "inline") {
    return (
      <details className={className}>
        <summary className="cursor-pointer font-bold">{summary}</summary>
        <LeftoverList leftovers={leftovers} className="mt-1" />
      </details>
    );
  }

  return (
    <div className={className}>
      <p>{summary}</p>
      <details className="group mt-1">
        <summary className="inline-flex items-center gap-1 cursor-pointer list-none text-[13px] text-purple-primary hover:underline [&::-webkit-details-marker]:hidden">
          <svg
            viewBox="0 0 12 12"
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="transition-transform duration-150 group-open:rotate-90"
          >
            <path d="M4.5 2.5 8 6l-3.5 3.5" />
          </svg>
          <span className="group-open:hidden">
            Show the {leftovers.length} token{leftovers.length === 1 ? "" : "s"}
          </span>
          <span className="hidden group-open:inline">Hide tokens</span>
        </summary>
        <LeftoverList leftovers={leftovers} className="mt-1.5" />
      </details>
    </div>
  );
}
