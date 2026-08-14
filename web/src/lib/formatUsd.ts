const usdFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatUsd(value: number, opts?: { signed?: boolean }) {
  if (!Number.isFinite(value)) return "—";
  const formatted = usdFormatter.format(Math.abs(value));
  if (opts?.signed) {
    const sign = value > 0 ? "+" : value < 0 ? "-" : "";
    return `${sign}${formatted}`;
  }
  return formatted;
}

export type SignedTone = "up" | "down" | "flat";

/** Treat sub-cent moves as unchanged so $0.00 is never painted as a gain. */
export function signedTone(value: number, epsilon = 0.005): SignedTone {
  if (!Number.isFinite(value) || Math.abs(value) < epsilon) return "flat";
  return value > 0 ? "up" : "down";
}

/** Theme-aware via --signed-up / --signed-down. Light is AA on white; dark is Seer neon. */
export const SIGNED_TONE_CLASS: Record<SignedTone, string> = {
  up: "text-signed-up",
  down: "text-signed-down",
  flat: "text-black-primary",
};

/** Hide percent when the prior value was ~0 and the ratio explodes. */
export function formatDeltaPercent(percent: number): string | undefined {
  if (!Number.isFinite(percent) || Math.abs(percent) >= 1000) return undefined;
  return `${percent.toFixed(2)}%`;
}
