import { formatBigNumbers } from "@/lib/utils";

/**
 * A ladder price (collateral per outcome share, 0–1) in cents, the way the limit-order views read
 * prices. Adjacent ticks can sit hundredths of a cent apart (0.4115 vs 0.4119), so the ladder keeps
 * two decimals where formatPriceCents rounds to one and would print both levels as "41.2¢".
 */
export function formatLadderPrice(price: string | number | null | undefined): string {
  if (price === null || price === undefined || price === "") return "—";
  const value = Number(price);
  if (!Number.isFinite(value) || value < 0) return "—";
  return `${(value * 100).toFixed(2)}¢`;
}

const SMALL_AMOUNT = new Intl.NumberFormat("en-US", { maximumSignificantDigits: 3 });
const REGULAR_AMOUNT = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * A share amount on the ladder. Two fixed decimals turned thin levels into a column of "0.00", so
 * amounts below one keep three significant digits and large ones compact to k/M/B.
 */
export function formatShareAmount(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount) || amount <= 0) return "0";
  if (amount < 0.0001) return "<0.0001";
  if (amount < 1) return SMALL_AMOUNT.format(amount);
  if (amount >= 10_000) return formatBigNumbers(amount);
  return REGULAR_AMOUNT.format(amount);
}
