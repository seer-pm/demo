/** Primary-collateral price of one parent outcome token for volume (not P/L). Always 1/N. */
export function volumePriceForParentOutcome(payoutNumerators: readonly bigint[]): number {
  const n = payoutNumerators.length;
  return n > 0 ? 1 / n : 0;
}
