import type { Address } from "viem";
import {
  creditsManagerAddress,
  opportunityCreditsAddress,
  opportunityCreditsManagerAddress,
  seerCreditsAddress,
} from "../generated/contracts/trading-credits";

export type CreditsProfileName = "SEER_CREDITS" | "OPPORTUNITY_CREDITS";

export const DEFAULT_CREDITS_PROFILE: CreditsProfileName = "SEER_CREDITS";

type CreditsProfile = {
  tokenByChain: Partial<Record<number, Address>>;
  managerByChain: Partial<Record<number, Address>>;
};

const CREDITS_PROFILES: Record<CreditsProfileName, CreditsProfile> = {
  SEER_CREDITS: {
    tokenByChain: seerCreditsAddress as Partial<Record<number, Address>>,
    managerByChain: creditsManagerAddress as Partial<Record<number, Address>>,
  },
  OPPORTUNITY_CREDITS: {
    tokenByChain: opportunityCreditsAddress as Partial<Record<number, Address>>,
    managerByChain: opportunityCreditsManagerAddress as Partial<Record<number, Address>>,
  },
};

let activeProfileName: CreditsProfileName = DEFAULT_CREDITS_PROFILE;

function isKnownCreditsProfileName(profileName: string): profileName is CreditsProfileName {
  return profileName in CREDITS_PROFILES;
}

/**
 * Select the active trading-credits profile for the frontend (optional — defaults to `"SEER_CREDITS"`).
 * @throws if `profileName` is not registered.
 */
export function configureCredits(profileName: string = DEFAULT_CREDITS_PROFILE): void {
  if (!isKnownCreditsProfileName(profileName)) {
    throw new Error(`Unknown credits profile "${profileName}"`);
  }
  activeProfileName = profileName;
}

/** Name of the active credits profile set by `configureCredits` (defaults to `"SEER_CREDITS"`). */
export function getActiveCreditsProfileName(): CreditsProfileName {
  return activeProfileName;
}

/** Display symbol for the active credits profile (same as profile name). */
export function getActiveCreditsSymbol(): CreditsProfileName {
  return activeProfileName;
}

export function getActiveCreditsTokenAddress(chainId: number): Address | undefined {
  return CREDITS_PROFILES[activeProfileName].tokenByChain[chainId];
}

export function getActiveCreditsManagerAddress(chainId: number): Address | undefined {
  return CREDITS_PROFILES[activeProfileName].managerByChain[chainId];
}

/** Whether `tokenAddress` is the active trading-credits token on `chainId`. */
export function isTradingCredits(chainId: number, tokenAddress: Address): boolean {
  const addressForChain = getActiveCreditsTokenAddress(chainId);
  if (!addressForChain) {
    return false;
  }
  return tokenAddress.toLowerCase() === addressForChain.toLowerCase();
}

/** Whether any credits profile is registered for `chainId` under the active profile. */
export function hasTradingCredits(chainId: number): boolean {
  return getActiveCreditsTokenAddress(chainId) !== undefined;
}
