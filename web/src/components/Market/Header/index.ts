import { MarketStatus } from "@/hooks/useMarketStatus";
import { MarketTypes } from "@/lib/market";
import { isUndefined } from "@/lib/utils";

export const STATUS_TEXTS: Record<MarketStatus, (hasLiquidity?: boolean) => string> = {
  [MarketStatus.NOT_OPEN]: (hasLiquidity?: boolean) => {
    if (isUndefined(hasLiquidity)) {
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

export type ColorConfig = {
  border: string;
  bg: string;
  text: string;
  dot: string;
};
export const COLORS: Record<MarketStatus, ColorConfig> = {
  [MarketStatus.NOT_OPEN]: {
    border: "border-t-[#25cdfe]",
    bg: "bg-black-light",
    text: "text-[#25cdfe]",
    dot: "bg-[#25cdfe]",
  },
  [MarketStatus.OPEN]: {
    border: "border-t-purple-primary",
    bg: "bg-purple-medium",
    text: "text-purple-primary",
    dot: "bg-purple-primary",
  },
  [MarketStatus.ANSWER_NOT_FINAL]: {
    border: "border-t-warning-primary",
    bg: "bg-warning-light",
    text: "text-warning-primary",
    dot: "bg-warning-primary",
  },
  [MarketStatus.IN_DISPUTE]: {
    border: "border-t-blue-secondary",
    bg: "bg-blue-light",
    text: "text-blue-secondary",
    dot: "bg-blue-secondary",
  },
  [MarketStatus.PENDING_EXECUTION]: {
    border: "border-t-tint-blue-primary",
    bg: "bg-tint-blue-light",
    text: "text-tint-blue-primary",
    dot: "bg-tint-blue-primary",
  },
  [MarketStatus.CLOSED]: {
    border: "border-t-success-primary",
    bg: "bg-success-light",
    text: "text-success-primary",
    dot: "bg-success-primary",
  },
};
