import { TickMath } from "@uniswap/v3-sdk";
import { BigNumber } from "ethers";
import { formatUnits } from "viem";

export function tickToPrice(tick: number, decimals = 18, keepPrecision = false) {
  const sqrtPriceX96 = BigInt(TickMath.getSqrtRatioAtTick(tick).toString());
  const bn = BigNumber.from(sqrtPriceX96);

  const TWO_POW_96 = BigNumber.from(2).pow(96);

  const price0 = bn
    .mul(bn) // square it
    .mul(BigNumber.from(10).pow(decimals))
    .div(TWO_POW_96)
    .div(TWO_POW_96)
    .toBigInt();
  const price1 = TWO_POW_96.mul(TWO_POW_96).mul(BigNumber.from(10).pow(decimals)).div(bn).div(bn).toBigInt();
  if (keepPrecision) {
    return [formatUnits(price0, 18), formatUnits(price1, 18)];
  }
  return [Number(formatUnits(price0, 18)).toFixed(4), Number(formatUnits(price1, 18)).toFixed(4)];
}

export function sqrtPriceX96ToPrice(sqrtPriceX96: bigint, decimals = 18, keepPrecision = false) {
  const bn = BigNumber.from(sqrtPriceX96);

  const TWO_POW_96 = BigNumber.from(2).pow(96);

  const price0 = bn
    .mul(bn) // square it
    .mul(BigNumber.from(10).pow(decimals))
    .div(TWO_POW_96)
    .div(TWO_POW_96)
    .toBigInt();
  const price1 = TWO_POW_96.mul(TWO_POW_96).mul(BigNumber.from(10).pow(decimals)).div(bn).div(bn).toBigInt();
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
