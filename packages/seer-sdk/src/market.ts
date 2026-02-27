import { escapeJson } from "./reality";

export enum MarketTypes {
  CATEGORICAL = "categorical",
  SCALAR = "scalar",
  MULTI_CATEGORICAL = "multi_categorical",
  MULTI_SCALAR = "multi_scalar",
}

export function getMarketName(marketType: MarketTypes, marketName: string, unit: string): string {
  return [MarketTypes.SCALAR, MarketTypes.MULTI_SCALAR].includes(marketType) && unit.trim()
    ? `${escapeJson(marketName)} [${escapeJson(unit)}]`
    : escapeJson(marketName);
}

export function getQuestionParts(
  marketName: string,
  marketType: MarketTypes,
): { questionStart: string; questionEnd: string; outcomeType: string } | undefined {
  if (marketType !== MarketTypes.MULTI_SCALAR) {
    return { questionStart: "", questionEnd: "", outcomeType: "" };
  }

  const parts = marketName.split(/\[|\]/);

  if (parts.length !== 3 && parts.length !== 5) {
    return undefined;
  }

  if (parts.length === 5) {
    const unitRegex = /\?\s*\[[^\]]+\]$/;
    if (!unitRegex.test(marketName)) {
      return undefined;
    }
  }

  if (marketName.indexOf("[") > marketName.indexOf("]")) {
    return undefined;
  }

  const [questionStart, outcomeType, questionEnd] = parts;
  if (!questionEnd?.trim() || !outcomeType?.trim()) {
    return undefined;
  }

  if (parts.length === 5) {
    return { questionStart, questionEnd: `${questionEnd}[${parts[3]}]`, outcomeType };
  }

  return { questionStart, questionEnd, outcomeType };
}

export function getOutcomes(outcomes: string[], marketType: MarketTypes): string[] {
  if (marketType === MarketTypes.SCALAR) {
    return ["DOWN", "UP", ...outcomes.slice(2)];
  }
  return outcomes;
}
