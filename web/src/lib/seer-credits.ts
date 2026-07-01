import SEER_ENV from "./env";

export function isSeerCreditsDisabled(): boolean {
  return SEER_ENV.VITE_SEER_CREDITS_DISABLED === "true";
}
