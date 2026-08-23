/** Capital dust in USD below which ROI is undefined. */
export const ROI_CAPITAL_DUST_USD = 0.01;

/**
 * Deployed capital in USD for ROI:
 *   capital_usd = value_start_usd + capital_deployed_usd
 *
 * `capitalDeployed` is measured at compute time (primary swap buys + scoped router splits).
 */
export function capitalUsdFromRow(args: {
  valueStart: number;
  capitalDeployed: number;
  collateralPriceUsd: number;
}): number {
  const price = Number(args.collateralPriceUsd) || 0;
  return (Number(args.valueStart) || 0) * price + Math.max(Number(args.capitalDeployed) || 0, 0) * price;
}

/** ROI in USD space; null when capital is dust. */
export function computeRoiUsd(args: {
  pnlUsd: number;
  valueStart: number;
  capitalDeployed: number;
  collateralPriceUsd: number;
}): number | null {
  const capitalUsd = capitalUsdFromRow(args);
  if (capitalUsd < ROI_CAPITAL_DUST_USD) return null;
  return args.pnlUsd / capitalUsd;
}

/** Same dust rule as `computeRoiUsd`, for already-aggregated capital across chains. */
export function roiFromCapitalUsd(pnlUsd: number, capitalUsd: number): number | null {
  if (capitalUsd < ROI_CAPITAL_DUST_USD) return null;
  return pnlUsd / capitalUsd;
}
