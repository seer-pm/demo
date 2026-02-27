import type { Address } from "viem";
import { base, gnosis, mainnet, optimism, sepolia } from "viem/chains";

export const NATIVE_TOKEN: Address = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export interface Token {
  address: Address;
  chainId: number;
  symbol: string;
  decimals: number;
  wrapped?: Token;
}

export const TOKENS_BY_CHAIN = {
  [gnosis.id]: {
    sDAI: "0xaf204776c7245bf4147c2612bf6e5972ee483701",
    xDAI: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
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

export type CollateralTokensMap = Record<number, { primary: Token; secondary: Token | undefined; swap?: Token[] }>;

export const COLLATERAL_TOKENS: CollateralTokensMap = {
  [gnosis.id]: {
    primary: { address: TOKENS_BY_CHAIN[gnosis.id].sDAI, chainId: gnosis.id, symbol: "sDAI", decimals: 18 },
    secondary: {
      address: NATIVE_TOKEN,
      chainId: gnosis.id,
      symbol: "xDAI",
      decimals: 18,
      wrapped: { address: TOKENS_BY_CHAIN[gnosis.id].xDAI, chainId: gnosis.id, symbol: "wxDAI", decimals: 18 },
    },
  },
  [mainnet.id]: {
    primary: { address: TOKENS_BY_CHAIN[mainnet.id].sDAI, chainId: mainnet.id, symbol: "sDAI", decimals: 18 },
    secondary: { address: TOKENS_BY_CHAIN[mainnet.id].DAI, chainId: mainnet.id, symbol: "DAI", decimals: 18 },
  },
  [optimism.id]: {
    primary: { address: TOKENS_BY_CHAIN[optimism.id].sUSDS, chainId: optimism.id, symbol: "sUSDS", decimals: 18 },
    secondary: undefined,
    swap: [
      { address: TOKENS_BY_CHAIN[optimism.id].USDS, chainId: optimism.id, symbol: "USDS", decimals: 18 },
      { address: TOKENS_BY_CHAIN[optimism.id].USDC, chainId: optimism.id, symbol: "USDC", decimals: 6 },
    ],
  },
  [base.id]: {
    primary: { address: TOKENS_BY_CHAIN[base.id].sUSDS, chainId: base.id, symbol: "sUSDS", decimals: 18 },
    secondary: undefined,
    swap: [
      { address: TOKENS_BY_CHAIN[base.id].USDS, chainId: base.id, symbol: "USDS", decimals: 18 },
      { address: TOKENS_BY_CHAIN[base.id].USDC, chainId: base.id, symbol: "USDC", decimals: 6 },
    ],
  },
  [sepolia.id]: {
    primary: {
      address: "0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357",
      chainId: sepolia.id,
      symbol: "DAI",
      decimals: 18,
    },
    secondary: undefined,
  },
};

/**
 * Returns the primary collateral token address for the given chain.
 * Use this when building swap paths (e.g. outcome token / collateral pools).
 */
export function getPrimaryCollateralAddress(chainId: number): Address {
  const entry = COLLATERAL_TOKENS[chainId];
  if (!entry?.primary) {
    throw new Error(`No primary collateral for chain ${chainId}`);
  }
  return entry.primary.address;
}
