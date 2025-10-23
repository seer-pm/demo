import { Address } from "viem";
import { getConfigNumber } from "./config";
import { MarketTypes, getMarketName, getOutcomes, getQuestionParts } from "./market";
import { escapeJson } from "./reality";

export interface CreateMarketProps {
  marketType: MarketTypes;
  marketName: string;
  collateralToken1: Address | ""; // for futarchy markets
  collateralToken2: Address | ""; // for futarchy markets
  isArbitraryQuestion: boolean; // for futarchy markets
  parentMarket: Address;
  parentOutcome: bigint;
  outcomes: string[];
  tokenNames: string[];
  lowerBound: bigint;
  upperBound: bigint;
  unit: string;
  category: string;
  openingTime: number;
  chainId?: number;
}

export const MISC_CATEGORY = "misc";
export const WEATHER_CATEGORY = "weather";

export const MARKET_CATEGORIES: { value: string; text: string }[] = [
  { value: "elections", text: "Elections" },
  { value: "politics", text: "Politics" },
  { value: "business", text: "Business" },
  { value: "science", text: "Science" },
  { value: "crypto", text: "Crypto" },
  { value: "pop_culture", text: "Pop Culture" },
  { value: "sports", text: "Sports" },
  { value: "doge", text: "DOGE" },
  { value: MISC_CATEGORY, text: "Miscellaneous" },
  { value: WEATHER_CATEGORY, text: "Weather" },
];

function generateTokenName(outcome: string) {
  return outcome
    .replace(/[^\w\s]/gi, "") // remove special characters
    .replace(/[\u00A0\u2000-\u200F\u202F\u205F\u3000]/g, " ") // replace non-breaking spaces with normal spaces
    .replaceAll("_", " ") // replace underscores with spaces
    .replace(/ {2,}/g, " ") // remove consecutive spaces
    .trim() // trim
    .replaceAll(" ", "_") // replace spaces with underscore
    .toLocaleUpperCase() // uppercase
    .substring(0, 11); // 11 characters to follow the verification policy
}

function getTokenNames(tokenNames: string[], outcomes: string[]) {
  // we loop over `outcomes` because it's the return value of getOutcomes(),
  // that already has the correct outcomes for scalar markets
  return outcomes.map((outcome, i) =>
    (tokenNames[i].trim() !== "" ? tokenNames[i].trim() : generateTokenName(outcome)).slice(0, 31),
  );
}

export function getCreateMarketParams(props: CreateMarketProps) {
  const outcomes = getOutcomes(props.outcomes, props.marketType);
  const marketName = getMarketName(props.marketType, props.marketName, props.unit);
  const questionParts = getQuestionParts(marketName, props.marketType);

  return {
    marketName,
    questionStart: escapeJson(questionParts?.questionStart || ""),
    questionEnd: escapeJson(questionParts?.questionEnd || ""),
    outcomeType: escapeJson(questionParts?.outcomeType || ""),
    parentMarket: props.parentMarket,
    parentOutcome: props.parentOutcome,
    lang: "en_US",
    category: props.category || "misc",
    outcomes: outcomes.map(escapeJson),
    tokenNames: getTokenNames(props.tokenNames, outcomes),
    lowerBound: props.lowerBound,
    upperBound: props.upperBound,
    minBond: getConfigNumber("MIN_BOND", props.chainId),
    openingTime: props.openingTime,
  };
}
