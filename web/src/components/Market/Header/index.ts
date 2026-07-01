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

// Theme-aware palette: values are CSS variables so light/dark resolve automatically.
// Yes/No categorical -> green/red; multi cycles through the brand blue + category hues.
export const BAR_COLOR = {
  [MarketTypes.CATEGORICAL]: ["var(--pos-bar)", "var(--neg-bar)"],
  [MarketTypes.MULTI_CATEGORICAL]: [
    "var(--blue)",
    "var(--cat-2)",
    "var(--cat-3)",
    "var(--cat-4)",
    "var(--cat-5)",
    "var(--cat-1)",
  ],
  [MarketTypes.SCALAR]: ["var(--blue)", "var(--cat-2)"],
  [MarketTypes.MULTI_SCALAR]: [
    "var(--blue)",
    "var(--cat-2)",
    "var(--cat-3)",
    "var(--cat-4)",
    "var(--cat-5)",
    "var(--cat-1)",
  ],
};
