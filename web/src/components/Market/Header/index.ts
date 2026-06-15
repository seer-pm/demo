import { MarketStatus, MarketTypes } from "@seer-pm/sdk";

export type ColorConfig = {
  border: string;
  bg: string;
  // light tint of the text color, used for the status pill background
  pillBg: string;
  text: string;
  dot: string;
};

export const COLORS: Record<MarketStatus, ColorConfig> = {
  [MarketStatus.NOT_OPEN]: {
    border: "border-t-[#25cdfe]",
    bg: "bg-black-light dark:bg-base-200",
    pillBg: "bg-[#25cdfe]/10",
    text: "text-[#25cdfe]",
    dot: "bg-[#25cdfe]",
  },
  [MarketStatus.OPEN]: {
    border: "border-t-[#9747FF]",
    bg: "bg-[#FBF8FF] dark:bg-base-200",
    pillBg: "bg-[#9747FF]/10",
    text: "text-[#9747FF]",
    dot: "bg-[#9747FF]",
  },
  [MarketStatus.ANSWER_NOT_FINAL]: {
    border: "border-t-warning-primary",
    bg: "bg-warning-light dark:bg-base-200",
    pillBg: "bg-warning-primary/10",
    text: "text-warning-primary",
    dot: "bg-warning-primary",
  },
  [MarketStatus.IN_DISPUTE]: {
    border: "border-t-blue-secondary",
    bg: "bg-blue-light dark:bg-base-200",
    pillBg: "bg-blue-secondary/10",
    text: "text-blue-secondary",
    dot: "bg-blue-secondary",
  },
  [MarketStatus.PENDING_EXECUTION]: {
    border: "border-t-tint-blue-primary",
    bg: "bg-tint-blue-light dark:bg-base-200",
    pillBg: "bg-tint-blue-primary/10",
    text: "text-tint-blue-primary",
    dot: "bg-tint-blue-primary",
  },
  [MarketStatus.CLOSED]: {
    border: "border-t-success-primary",
    bg: "bg-success-light dark:bg-base-200",
    pillBg: "bg-success-primary/10",
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
