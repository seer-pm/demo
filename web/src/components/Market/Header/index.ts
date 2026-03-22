import { MarketStatus, MarketTypes } from "@seer-pm/sdk";

export type ColorConfig = {
  border: string;
  bg: string;
  text: string;
  dot: string;
};

export const COLORS: Record<MarketStatus, ColorConfig> = {
  [MarketStatus.NOT_OPEN]: {
    border: "border-t-[#25cdfe]",
    bg: "bg-black-light dark:bg-base-200",
    text: "text-[#25cdfe]",
    dot: "bg-[#25cdfe]",
  },
  [MarketStatus.OPEN]: {
    border: "border-t-purple-primary",
    bg: "bg-purple-medium dark:bg-base-200",
    text: "text-purple-primary",
    dot: "bg-purple-primary",
  },
  [MarketStatus.ANSWER_NOT_FINAL]: {
    border: "border-t-warning-primary",
    bg: "bg-warning-light dark:bg-base-200",
    text: "text-warning-primary",
    dot: "bg-warning-primary",
  },
  [MarketStatus.IN_DISPUTE]: {
    border: "border-t-blue-secondary",
    bg: "bg-blue-light dark:bg-base-200",
    text: "text-blue-secondary",
    dot: "bg-blue-secondary",
  },
  [MarketStatus.PENDING_EXECUTION]: {
    border: "border-t-tint-blue-primary",
    bg: "bg-tint-blue-light dark:bg-base-200",
    text: "text-tint-blue-primary",
    dot: "bg-tint-blue-primary",
  },
  [MarketStatus.CLOSED]: {
    border: "border-t-success-primary",
    bg: "bg-success-light dark:bg-base-200",
    text: "text-success-primary",
    dot: "bg-success-primary",
  },
};

export const BAR_COLOR = {
  [MarketTypes.CATEGORICAL]: ["#13C0CB", "#FF458C"],
  [MarketTypes.MULTI_CATEGORICAL]: ["#9747FF", "#24CDFE", "#13C0CB"],
  [MarketTypes.SCALAR]: ["#FF458C", "#13C0CB"],
  [MarketTypes.MULTI_SCALAR]: ["#9747FF", "#24CDFE", "#13C0CB"],
};
