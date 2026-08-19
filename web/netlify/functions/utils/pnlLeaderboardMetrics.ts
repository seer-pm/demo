/** Capital dust in USD below which ROI is undefined. */
export const ROI_CAPITAL_DUST_USD = 0.01;

/**
 * Deployed capital in USD for ROI:
 *   capital_usd = value_start_usd + buys_usd
 *
 * where buys (primary as tokenIn) is recovered from stored swap aggregates:
 *   volume = primary_in + primary_out
 *   trading_collateral_net_out = primary_in - primary_out
 *   ⇒ buys = (volume + trading_collateral_net_out) / 2
 */
export function capitalUsdFromRow(args: {
  valueStart: number;
  volume: number;
  tradingCollateralNetOut: number;
  collateralPriceUsd: number;
}): number {
  const price = Number(args.collateralPriceUsd) || 0;
  const buys = ((Number(args.volume) || 0) + (Number(args.tradingCollateralNetOut) || 0)) / 2;
  return (Number(args.valueStart) || 0) * price + Math.max(buys, 0) * price;
}

/** ROI in USD space; null when capital is dust. */
export function computeRoiUsd(args: {
  pnlUsd: number;
  valueStart: number;
  volume: number;
  tradingCollateralNetOut: number;
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
