import { displayBalance } from "@/lib/utils";
import type { CompleteSetLeftover } from "@seer-pm/sdk";

/**
 * A split mints one token per outcome, so on a market with many outcomes mint-to-cover leaves many
 * behind and a flat "A + B + C + ..." line stops being readable — outcome symbols are full
 * human-readable outcome text, not tickers.
 *
 * Every leftover is the same amount by construction (they all come from the one split), so the
 * summary is exact, not a rounding. The per-token list is detail, never information the summary
 * drops.
 */
export function summarizeLeftovers(leftovers: CompleteSetLeftover[]): string {
  const [first] = leftovers;
  if (!first) {
    return "";
  }
  const amount = displayBalance(first.amount, first.token.decimals, false);
  return `${amount} of each of the ${leftovers.length} other outcome${leftovers.length === 1 ? "" : "s"}`;
}

export function formatLeftoverList(leftovers: CompleteSetLeftover[]): string {
  return leftovers
    .map((leftover) => `${displayBalance(leftover.amount, leftover.token.decimals, false)} ${leftover.token.symbol}`)
    .join(" + ");
}
