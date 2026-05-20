import { DAI, WXDAI } from "@swapr/sdk";
import type { Address } from "viem";
import { base, gnosis, mainnet, optimism, sepolia } from "viem/chains";
import { isTwoStringsEqual, isUndefined } from "./quote-utils";
import { NATIVE_TOKEN, type Token } from "./tokens";

export { NATIVE_TOKEN, type Token } from "./tokens";

export const DEFAULT_COLLATERAL_PROFILE = "default" as const;

export function hasAltCollateral(token: Token | undefined): token is Token {
  return !isUndefined(token);
}

export const TOKENS_BY_CHAIN = {
  [gnosis.id]: {
    sDAI: "0xaf204776c7245bf4147c2612bf6e5972ee483701",
    xDAI: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
    "s-gCRC": "0xeef7b1f06b092625228c835dd5d5b14641d1e54a",
  },
  [mainnet.id]: {
    sDAI: "0x83F20F44975D03b1b09e64809B757c47f942BEeA",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  },
  [optimism.id]: {
    sUSDS: "0xb5b2dc7fd34c249f4be7fb1fcea07950784229e0",
    USDS: "0x4f13a96ec5c4cf34e442b46bbd98a0791f20edc3",
    USDC: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
  },
  [base.id]: {
    sUSDS: "0x5875eee11cf8398102fdad704c9e96607675467a",
    USDS: "0x820c137fa70c8691f0e44dc420a5e53c168921dc",
    USDC: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  },
} as const;

export type CollateralProfile = {
  primary: Token;
  secondary?: Token;
  swap?: Token[];
};

type NamedCollateralProfilesByChain = Record<number, Record<string, CollateralProfile>>;

/**
 * Static registry of every collateral profile Seer supports, keyed by chain and profile name.
 *
 * Each chain has a **default** profile (sDAI on Gnosis, etc.) plus optional named profiles (e.g. **circles**).
 * A profile is one way to fund markets: a **primary** ERC20, plus optional **secondary** and **swap** tokens.
 */
const COLLATERAL_PROFILES: NamedCollateralProfilesByChain = {
  [gnosis.id]: {
    default: {
      primary: { address: TOKENS_BY_CHAIN[gnosis.id].sDAI, chainId: gnosis.id, symbol: "sDAI", decimals: 18 },
      secondary: {
        address: NATIVE_TOKEN,
        chainId: gnosis.id,
        symbol: "xDAI",
        decimals: 18,
        wrapped: { address: TOKENS_BY_CHAIN[gnosis.id].xDAI, chainId: gnosis.id, symbol: "wxDAI", decimals: 18 },
      },
    },
    circles: {
      primary: {
        address: TOKENS_BY_CHAIN[gnosis.id]["s-gCRC"],
        chainId: gnosis.id,
        symbol: "s-gCRC",
        decimals: 18,
      },
    },
  },
  [mainnet.id]: {
    default: {
      primary: { address: TOKENS_BY_CHAIN[mainnet.id].sDAI, chainId: mainnet.id, symbol: "sDAI", decimals: 18 },
      secondary: { address: TOKENS_BY_CHAIN[mainnet.id].DAI, chainId: mainnet.id, symbol: "DAI", decimals: 18 },
    },
  },
  [optimism.id]: {
    default: {
      primary: { address: TOKENS_BY_CHAIN[optimism.id].sUSDS, chainId: optimism.id, symbol: "sUSDS", decimals: 18 },
      swap: [
        { address: TOKENS_BY_CHAIN[optimism.id].USDS, chainId: optimism.id, symbol: "USDS", decimals: 18 },
        { address: TOKENS_BY_CHAIN[optimism.id].USDC, chainId: optimism.id, symbol: "USDC", decimals: 6 },
      ],
    },
  },
  [base.id]: {
    default: {
      primary: { address: TOKENS_BY_CHAIN[base.id].sUSDS, chainId: base.id, symbol: "sUSDS", decimals: 18 },
      swap: [
        { address: TOKENS_BY_CHAIN[base.id].USDS, chainId: base.id, symbol: "USDS", decimals: 18 },
        { address: TOKENS_BY_CHAIN[base.id].USDC, chainId: base.id, symbol: "USDC", decimals: 6 },
      ],
    },
  },
  [sepolia.id]: {
    default: {
      primary: {
        address: "0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357",
        chainId: sepolia.id,
        symbol: "DAI",
        decimals: 18,
      },
    },
  },
};

let activeProfileName: string = DEFAULT_COLLATERAL_PROFILE;

function getNamedProfiles(chainId: number): Record<string, CollateralProfile> {
  return COLLATERAL_PROFILES[chainId] ?? {};
}

function isKnownProfileName(profileName: string): boolean {
  return Object.values(COLLATERAL_PROFILES).some((chainProfiles) => profileName in chainProfiles);
}

/**
 * Select the active collateral profile for the frontend (optional — defaults to `"default"`).
 * @throws if `profileName` is not registered on any chain.
 */
export function configureCollateral(profileName: string = DEFAULT_COLLATERAL_PROFILE): void {
  if (!isKnownProfileName(profileName)) {
    throw new Error(`Unknown collateral profile "${profileName}"`);
  }
  activeProfileName = profileName;
}

export function getCollateralProfileByName(chainId: number, profileName: string): CollateralProfile {
  const profile = getNamedProfiles(chainId)[profileName];
  if (!profile) {
    throw new Error(`Collateral profile "${profileName}" is not available on chain ${chainId}`);
  }
  return profile;
}

export function getDefaultCollateralProfile(chainId: number): CollateralProfile {
  return getCollateralProfileByName(chainId, DEFAULT_COLLATERAL_PROFILE);
}

/**
 * Every collateral profile Seer supports on a chain (default first, then other names).
 */
export function getCollateralProfiles(chainId: number): CollateralProfile[] {
  const named = getNamedProfiles(chainId);
  const { default: defaultProfile, ...rest } = named;
  if (!defaultProfile) {
    return Object.values(named);
  }
  return [defaultProfile, ...Object.values(rest)];
}

export function getAllPrimaryCollaterals(chainId: number): Token[] {
  return getCollateralProfiles(chainId).map((p) => p.primary);
}

/** Name of the active collateral profile set by `configureCollateral` (defaults to `"default"`). */
export function getActiveCollateralProfileName(): string {
  return activeProfileName;
}

/** Active site profile after `configureCollateral` (defaults to `"default"`). */
export function getActiveCollateralProfile(chainId: number): CollateralProfile {
  return getCollateralProfileByName(chainId, activeProfileName);
}

export function getActivePrimaryCollateral(chainId: number): Token {
  return getActiveCollateralProfile(chainId).primary;
}

/**
 * Returns the collateral token address to use for a swap (e.g. sDAI for xDAI/wxDAI/DAI).
 */
export function getCollateralTokenForSwap(tokenAddress: Address, chainId: number): Address {
  if (activeProfileName !== DEFAULT_COLLATERAL_PROFILE) {
    return tokenAddress;
  }
  if (
    isTwoStringsEqual(tokenAddress, WXDAI[chainId]?.address) ||
    isTwoStringsEqual(tokenAddress, DAI[chainId]?.address) ||
    isTwoStringsEqual(tokenAddress, NATIVE_TOKEN)
  ) {
    return getActivePrimaryCollateral(chainId).address;
  }
  return tokenAddress;
}

/**
 * Returns the display symbol for a collateral token (e.g. "xDAI" for native on Gnosis).
 */
export function getCollateralSymbol(
  tokenAddress: Address,
  account: Address,
  owner: Address,
  chainId: number,
  tokenIdToTokenSymbolMapping: Record<string, string> = {},
): string | undefined {
  if (isTwoStringsEqual(tokenAddress, WXDAI[chainId]?.address)) {
    if (!isTwoStringsEqual(owner, account) && chainId === gnosis.id) {
      return "xDAI";
    }
    return WXDAI[chainId]?.symbol;
  }
  if (isTwoStringsEqual(tokenAddress, DAI[chainId]?.address)) {
    return DAI[chainId]?.symbol;
  }
  if (isTwoStringsEqual(tokenAddress, NATIVE_TOKEN) && chainId === gnosis.id) {
    return "xDAI";
  }
  for (const primary of getAllPrimaryCollaterals(chainId)) {
    if (isTwoStringsEqual(tokenAddress, primary.address)) {
      return primary.symbol;
    }
  }
  return tokenIdToTokenSymbolMapping?.[tokenAddress.toLocaleLowerCase()];
}
