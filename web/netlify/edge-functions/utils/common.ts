import { formatUnits } from "https://esm.sh/viem@2.17.5";
import { MarketTypes, SimpleMarket } from "./types.ts";

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

export function getMarketEstimate(odds: (number | null)[], market: SimpleMarket, convertToString?: boolean) {
  const { lowerBound, upperBound, marketName } = market;
  if (!isOdd(odds[0]) || !isOdd(odds[1])) {
    return "NA";
  }
  const estimate = ((odds[0]! * Number(lowerBound) + odds[1]! * Number(upperBound)) / 100).toFixed(0);
  if (!convertToString) {
    return estimate;
  }
  if (marketName.lastIndexOf("[") > -1) {
    return `${Number(estimate).toLocaleString()} ${marketName.slice(
      marketName.lastIndexOf("[") + 1,
      marketName.lastIndexOf("]"),
    )}`;
  }
  return Number(estimate).toLocaleString();
}

export function unescapeJson(txt: string) {
  return txt.replace(/\\"/g, '"');
}

export function formatBigNumbers(amount: number) {
  const quantifiers: [number, string][] = [
    [10 ** 9, "B"],
    [10 ** 6, "M"],
    [10 ** 3, "k"],
  ];

  for (const [denominator, letter] of quantifiers) {
    if (amount >= denominator) {
      return `${+Math.round((amount * 100) / denominator / 100)}${letter}`;
    }
  }

  return amount.toFixed(2);
}

export function displayBalance(amount: bigint, decimals: number, formatAmount = false) {
  const number = Number(formatUnits(amount, decimals));

  if (formatAmount) {
    return formatBigNumbers(number);
  }

  if (number % 1 === 0) {
    return String(number);
  }

  return number.toFixed(number < 0.1 ? 4 : 2);
}

export function formatOdds(odd: number | undefined | null, marketType: MarketTypes) {
  if (!isOdd(odd)) {
    return "";
  }
  if (marketType === MarketTypes.SCALAR) {
    return odd === 0 ? 0 : (odd! / 100).toFixed(3);
  }

  return `${odd}%`;
}

//const REALITY_TEMPLATE_UINT = 1;
const REALITY_TEMPLATE_SINGLE_SELECT = 2;
const REALITY_TEMPLATE_MULTIPLE_SELECT = 3;

export function getMarketType(market: SimpleMarket): MarketTypes {
  if (market.templateId === String(REALITY_TEMPLATE_SINGLE_SELECT)) {
    return MarketTypes.CATEGORICAL;
  }

  if (market.templateId === String(REALITY_TEMPLATE_MULTIPLE_SELECT)) {
    return MarketTypes.MULTI_CATEGORICAL;
  }

  if (market.questions.length > 1) {
    return MarketTypes.MULTI_SCALAR;
  }

  return MarketTypes.SCALAR;
}
