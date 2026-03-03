/**
 * String and number helpers used by quote/trade logic.
 */

export function isUndefined(value: unknown): value is undefined | null {
  return value === undefined || value === null;
}

export function isTwoStringsEqual(str1: string | undefined | null, str2: string | undefined | null): boolean {
  return !!str1?.trim() && str2?.trim()?.toLocaleLowerCase() === str1?.trim()?.toLocaleLowerCase();
}

export function parseFraction(floatString: string): [number, number] | null {
  const num = Number(floatString);
  if (Number.isNaN(num)) return null;

  const [intPart, decPart] = floatString.split(".");
  if (!decPart) return [num, 1];

  const numerator = Number.parseInt(intPart + decPart);
  const denominator = 10 ** decPart.length;
  const gcd = findGCD(numerator, denominator);

  return [numerator / gcd, denominator / gcd];
}

function findGCD(a: number, b: number): number {
  return b === 0 ? a : findGCD(b, a % b);
}
