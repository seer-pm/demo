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

const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);

/** Floor sqrt for non-negative bigint (Uniswap sdk-core port). */
function sqrt(value: bigint): bigint {
  if (value < 0n) {
    throw new Error("NEGATIVE");
  }
  if (value < MAX_SAFE_INTEGER) {
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

type BigintIsh = bigint | string | number;

/**
 * Returns the sqrt ratio as a Q64.96 for a given ratio of amount1 / amount0.
 * Port of Uniswap V3 encodeSqrtRatioX96.
 */
export function encodeSqrtRatioX96(amount1: BigintIsh, amount0: BigintIsh): bigint {
  const numerator = BigInt(amount1) << 192n;
  const denominator = BigInt(amount0);
  return sqrt(numerator / denominator);
}
