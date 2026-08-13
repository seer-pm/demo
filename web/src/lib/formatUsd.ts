export function formatUsd(value: number, opts?: { signed?: boolean }) {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (opts?.signed) {
    const sign = value > 0 ? "+" : value < 0 ? "-" : "";
    return `${sign}$${formatted}`;
  }
  return `$${formatted}`;
}
