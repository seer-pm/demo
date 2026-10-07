import { displayBalance, isTwoStringsEqual } from "@/lib/utils";
import type { CompleteSetLeftover } from "@seer-pm/sdk";

/**
 * A split mints one token per outcome, so on a market with many outcomes mint-to-cover leaves many
 * behind and a flat "A + B + C + ..." line stops being readable: outcome symbols are full
 * human-readable outcome text, not tickers.
 *
 * Every leftover is the same amount by construction (every split mints the same amount), so the
 * summary is exact, not a rounding. The per-token list is detail, never information the summary
 * drops. Covering a child market paid in the base collateral also splits its ancestors, and those
 * leftovers belong to other markets, so they are counted apart from `marketId`'s own.
 */
export function summarizeLeftovers(leftovers: CompleteSetLeftover[], marketId: string): string {
  const [first] = leftovers;
  if (!first) {
    return "";
  }
  const amount = displayBalance(first.amount, first.token.decimals, false);
  const own = leftovers.filter((leftover) => isTwoStringsEqual(leftover.marketId, marketId));
  const parents = leftovers.length - own.length;
  const summary = `${amount} of each of the ${own.length} other outcome${own.length === 1 ? "" : "s"}`;
  if (parents === 0) {
    return summary;
  }
  const parentMarketCount = new Set(
    leftovers
      .filter((leftover) => !isTwoStringsEqual(leftover.marketId, marketId))
      .map((leftover) => leftover.marketId),
  ).size;
  return `${summary} of this market and ${parents} of its parent market${parentMarketCount === 1 ? "" : "s"}`;
}

export function formatLeftoverList(leftovers: CompleteSetLeftover[]): string {
  return leftovers
    .map((leftover) => `${displayBalance(leftover.amount, leftover.token.decimals, false)} ${leftover.token.symbol}`)
    .join(" + ");
}
