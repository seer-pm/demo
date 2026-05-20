import type { CollateralProfile, SupportedChain, Token } from "@seer-pm/sdk";
import { DEFAULT_COLLATERAL_PROFILE, getCollateralProfileByName } from "@seer-pm/sdk";

export type ResolvedCollateral = {
  profile: CollateralProfile;
  profileName: string;
  primaryCollateral: Token;
};

export function parseCollateralProfileQueryParam(
  chainId: SupportedChain,
  profileParam: string | null | undefined,
): ResolvedCollateral | { error: string; status: number } {
  const profileName = profileParam?.trim() || DEFAULT_COLLATERAL_PROFILE;
  try {
    const profile = getCollateralProfileByName(chainId, profileName);
    return { profile, profileName, primaryCollateral: profile.primary };
  } catch (e) {
    return { error: e.message, status: 400 };
  }
}
