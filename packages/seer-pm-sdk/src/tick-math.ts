/** Uniswap V3 TickMath helpers using native bigint (SSR-safe, no jsbi / @uniswap/v3-sdk). */

export const MIN_TICK = -887272;
export const MAX_TICK = -MIN_TICK;

const Q32 = 2n ** 32n;
const MAX_UINT256 = 2n ** 256n - 1n;

function mulShift(val: bigint, mulBy: string): bigint {
  return (val * BigInt(mulBy)) >> 128n;
}

export function getSqrtRatioAtTick(tick: number): bigint {
  if (!Number.isInteger(tick) || tick < MIN_TICK || tick > MAX_TICK) {
    throw new Error("TICK");
  }

  const absTick = tick < 0 ? -tick : tick;
  let ratio = (absTick & 0x1) !== 0 ? 0xfffcb933bd6fad37aa2d162d1a594001n : 0x100000000000000000000000000000000n;

  if ((absTick & 0x2) !== 0) ratio = mulShift(ratio, "0xfff97272373d413259a46990580e213a");
  if ((absTick & 0x4) !== 0) ratio = mulShift(ratio, "0xfff2e50f5f656932ef12357cf3c7fdcc");
  if ((absTick & 0x8) !== 0) ratio = mulShift(ratio, "0xffe5caca7e10e4e61c3624eaa0941cd0");
  if ((absTick & 0x10) !== 0) ratio = mulShift(ratio, "0xffcb9843d60f6159c9db58835c926644");
  if ((absTick & 0x20) !== 0) ratio = mulShift(ratio, "0xff973b41fa98c081472e6896dfb254c0");
  if ((absTick & 0x40) !== 0) ratio = mulShift(ratio, "0xff2ea16466c96a3843ec78b326b52861");
  if ((absTick & 0x80) !== 0) ratio = mulShift(ratio, "0xfe5dee046a99a2a811c461f1969c3053");
  if ((absTick & 0x100) !== 0) ratio = mulShift(ratio, "0xfcbe86c7900a88aedcffc83b479aa3a4");
  if ((absTick & 0x200) !== 0) ratio = mulShift(ratio, "0xf987a7253ac413176f2b074cf7815e54");
  if ((absTick & 0x400) !== 0) ratio = mulShift(ratio, "0xf3392b0822b70005940c7a398e4b70f3");
  if ((absTick & 0x800) !== 0) ratio = mulShift(ratio, "0xe7159475a2c29b7443b29c7fa6e889d9");
  if ((absTick & 0x1000) !== 0) ratio = mulShift(ratio, "0xd097f3bdfd2022b8845ad8f792aa5825");
  if ((absTick & 0x2000) !== 0) ratio = mulShift(ratio, "0xa9f746462d870fdf8a65dc1f90e061e5");
  if ((absTick & 0x4000) !== 0) ratio = mulShift(ratio, "0x70d869a156d2a1b890bb3df62baf32f7");
  if ((absTick & 0x8000) !== 0) ratio = mulShift(ratio, "0x31be135f97d08fd981231505542fcfa6");
  if ((absTick & 0x10000) !== 0) ratio = mulShift(ratio, "0x9aa508b5b7a84e1c677de54f3e99bc9");
  if ((absTick & 0x20000) !== 0) ratio = mulShift(ratio, "0x5d6af8dedb81196699c329225ee604");
  if ((absTick & 0x40000) !== 0) ratio = mulShift(ratio, "0x2216e584f5fa1ea926041bedfe98");
  if ((absTick & 0x80000) !== 0) ratio = mulShift(ratio, "0x48a170391f7dc42444e8fa2");

  if (tick > 0) {
    ratio = MAX_UINT256 / ratio;
  }

  return ratio % Q32 > 0n ? ratio / Q32 + 1n : ratio / Q32;
}

export function nearestUsableTick(tick: number, tickSpacing: number): number {
  if (!Number.isInteger(tick) || !Number.isInteger(tickSpacing) || tickSpacing <= 0) {
    throw new Error("TICK_SPACING");
  }
  if (tick < MIN_TICK || tick > MAX_TICK) {
    throw new Error("TICK_BOUND");
  }

  const rounded = Math.round(tick / tickSpacing) * tickSpacing;
  if (rounded < MIN_TICK) return rounded + tickSpacing;
  if (rounded > MAX_TICK) return rounded - tickSpacing;
  return rounded;
}

/** Uniswap V3 fee tier → tick spacing (from @uniswap/v3-sdk TICK_SPACINGS). */
export const UNISWAP_V3_TICK_SPACINGS: Record<number, number> = {
  100: 1,
  200: 4,
  300: 6,
  400: 8,
  500: 10,
  3000: 60,
  10000: 200,
};

export function uniswapV3TickSpacing(feeTier: number): number {
  return UNISWAP_V3_TICK_SPACINGS[feeTier] ?? 60;
}

function sqrt(value: bigint): bigint {
  if (value < 0n) {
    throw new Error("NEGATIVE");
  }

  const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
  if (value < maxSafe) {
    return BigInt(Math.floor(Math.sqrt(Number(value))));
  }

  let z = value;
  let x = value / 2n + 1n;
  while (x < z) {
    z = x;
    x = (value / x + x) / 2n;
  }
  return z;
}

/** Encodes token1/token0 price ratio as sqrtRatioX96 (from @uniswap/v3-sdk encodeSqrtRatioX96). */
export function encodeSqrtRatioX96(amount1: bigint | string | number, amount0: bigint | string | number): bigint {
  const ratioX192 = (BigInt(amount1) << 192n) / BigInt(amount0);
  return sqrt(ratioX192);
}
