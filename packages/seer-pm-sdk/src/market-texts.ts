import { MarketTypes } from "./market";
import { MarketStatus } from "./market-types";

export const STATUS_TEXTS: Record<MarketStatus, (hasLiquidity?: boolean) => string> = {
  [MarketStatus.NOT_OPEN]: (hasLiquidity?: boolean) => {
    if (hasLiquidity == null) {
      return "Reports not open yet";
    }
    return hasLiquidity ? "Trading Open" : "Liquidity Required";
  },
  [MarketStatus.OPEN]: () => "Reports open",
  [MarketStatus.ANSWER_NOT_FINAL]: () => "Waiting for answer",
  [MarketStatus.IN_DISPUTE]: () => "In Dispute",
  [MarketStatus.PENDING_EXECUTION]: () => "Pending execution",
  [MarketStatus.CLOSED]: () => "Closed",
};

export const MARKET_TYPES_TEXTS: Record<MarketTypes, string> = {
  [MarketTypes.CATEGORICAL]: "Categorical",
  [MarketTypes.SCALAR]: "Scalar",
  [MarketTypes.MULTI_CATEGORICAL]: "Multi Categorical",
  [MarketTypes.MULTI_SCALAR]: "Multi Scalar",
};

export const MARKET_TYPES_DESCRIPTION: Record<MarketTypes, string> = {
  [MarketTypes.CATEGORICAL]: "Predict one outcome from multiple options. The correct outcome redeems for 1.",
  [MarketTypes.SCALAR]:
    "Predict a numeric value within a defined range. Redemption depends on the answer and the corresponding outcome (see the tooltip for each outcome).",
  [MarketTypes.MULTI_CATEGORICAL]:
    "Predict one or more correct outcomes from multiple options. Each correct outcome redeems for (1 / number of correct outcomes).",
  [MarketTypes.MULTI_SCALAR]:
    "Predict multiple numeric outcomes, each with its own answer. Each outcome redeems for (outcome's answer / sum of all answers).",
};
