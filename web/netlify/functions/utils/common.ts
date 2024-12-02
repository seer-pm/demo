// biome-ignore lint/suspicious/noExplicitAny:
export const isUndefined = (maybeObject: any): maybeObject is undefined | null => {
  return typeof maybeObject === "undefined" || maybeObject === null;
};

export function bigIntMax(...args: bigint[]): bigint {
  if (!args.length) return 0n;
  return args.reduce((m, e) => (e > m ? e : m));
}

export function isTwoStringsEqual(str1: string | undefined | null, str2: string | undefined | null) {
  return str1?.trim() && str2?.trim()?.toLocaleLowerCase() === str1?.trim()?.toLocaleLowerCase();
}

export function isOdd(odd: number | undefined | null) {
  return typeof odd === "number" && !Number.isNaN(odd) && !isUndefined(odd);
}

export function getMarketEstimate(odds: number[], lowerBound: bigint, upperBound: bigint) {
  if (!isOdd(odds[0]) || !isOdd(odds[1])) {
    return "NA";
  }
  return ((odds[0] * Number(lowerBound) + odds[1] * Number(upperBound)) / 100).toFixed(2);
}

export function unescapeJson(txt: string) {
  return txt.replace(/\\"/g, '"');
}
