export function formatSeer(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

export function seerValue(value: number | undefined) {
  return `${formatSeer(value)} SEER`;
}

export function hasAmount(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
