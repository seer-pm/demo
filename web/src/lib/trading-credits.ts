import SEER_ENV from "./env";

export function isTradingCreditsDisabled(): boolean {
  return SEER_ENV.VITE_CREDITS_DISABLED === "true";
}
