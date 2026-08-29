/** Capital dust in USD below which ROI is undefined. */
export const ROI_CAPITAL_DUST_USD = 0.01;

/**
 * Deployed capital in USD for ROI: `capital_deployed_usd`, on its own.
 *
 * `capitalDeployed` is the **peak primary collateral at risk** in the window, seeded with the
 * position already open when the window started (`peakCapitalDeployedByMarket`), so it is the whole
 * denominator. It used to be `value_start + capital_deployed`, which was wrong twice over:
 * `value_start` carries a router cash term that goes negative precisely when capital is committed,
 * and the two halves overlapped for any position held across the window boundary.
 */
export function capitalUsdFromRow(args: { capitalDeployed: number; collateralPriceUsd: number }): number {
  const price = Number(args.collateralPriceUsd) || 0;
  return Math.max(Number(args.capitalDeployed) || 0, 0) * price;
}

/** ROI in USD space; null when capital is dust. */
export function computeRoiUsd(args: {
  pnlUsd: number;
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
