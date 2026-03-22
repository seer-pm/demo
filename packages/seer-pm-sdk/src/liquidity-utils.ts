import { TickMath } from "@uniswap/v3-sdk";
import { formatUnits } from "viem";

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
  const sqrtPriceX96 = BigInt(TickMath.getSqrtRatioAtTick(tick).toString());
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
