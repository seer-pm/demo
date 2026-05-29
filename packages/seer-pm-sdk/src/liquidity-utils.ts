import { formatUnits } from "viem";
import { MAX_TICK, MIN_TICK, getSqrtRatioAtTick } from "./tick-math";

const TWO_POW_96 = 2n ** 96n;

function sqrtPriceX96ToPriceRaw(sqrtPriceX96: bigint, decimals: number): [bigint, bigint] {
  const tenDecimals = 10n ** BigInt(decimals);
  const sqrtSquared = sqrtPriceX96 * sqrtPriceX96;
  const twoPow192 = TWO_POW_96 * TWO_POW_96;

  const price0 = (sqrtSquared * tenDecimals) / twoPow192;
  const price1 = (twoPow192 * tenDecimals) / sqrtSquared;

  return [price0, price1];
}

export function tickToPrice(tick: number, decimals = 18, keepPrecision = false) {
  const sqrtPriceX96 = getSqrtRatioAtTick(tick);
  const [price0, price1] = sqrtPriceX96ToPriceRaw(sqrtPriceX96, decimals);

  if (keepPrecision) {
    return [formatUnits(price0, 18), formatUnits(price1, 18)];
  }
  return [Number(formatUnits(price0, 18)).toFixed(4), Number(formatUnits(price1, 18)).toFixed(4)];
}

export function sqrtPriceX96ToPrice(sqrtPriceX96: bigint, decimals = 18, keepPrecision = false) {
  const [price0, price1] = sqrtPriceX96ToPriceRaw(sqrtPriceX96, decimals);

  if (keepPrecision) {
    return [formatUnits(price0, 18), formatUnits(price1, 18)];
  }
  return [Number(formatUnits(price0, 18)).toFixed(4), Number(formatUnits(price1, 18)).toFixed(4)];
}

export function decimalToFraction(x: number): [string, string] {
  const str = x.toString();
  if (!str.includes(".")) return [String(x), "1"];
  const decimals = str.split(".")[1].length;
  const numerator = Math.round(x * 10 ** decimals);
  const denominator = 10 ** decimals;
  return [String(numerator), String(denominator)];
}

/** Inverse of TickMath.getSqrtRatioAtTick using native bigint (SSR-safe, no JSBI import). */
export function sqrtPriceX96ToTick(sqrtPriceX96: bigint): number {
  let lo = MIN_TICK;
  let hi = MAX_TICK;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const sqrtMid = getSqrtRatioAtTick(mid);

    if (sqrtMid <= sqrtPriceX96) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return lo - 1;
}
