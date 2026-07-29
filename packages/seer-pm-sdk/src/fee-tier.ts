/** Uniswap V3 fee tier → tick spacing (no @uniswap/v3-sdk import; safe for SSR). */
const FEE_TIER_TICK_SPACING: Record<number, number> = {
  100: 1,
  500: 10,
  3000: 60,
  10000: 200,
};

const DEFAULT_TICK_SPACING = 60;

export function tickSpacingForFeeTier(feeTier: number): number {
  return FEE_TIER_TICK_SPACING[feeTier] ?? DEFAULT_TICK_SPACING;
}
