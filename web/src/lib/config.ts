import { Address, Chain, parseUnits, zeroAddress } from "viem";
import { gnosis, hardhat, mainnet } from "viem/chains";
import { Token } from "./tokens";
import { NATIVE_TOKEN } from "./utils";

export const DEFAULT_CHAIN = gnosis.id;

export const SUPPORTED_CHAINS: Record<number, Chain> = {
  [gnosis.id]: gnosis,
  //[hardhat.id]: hardhat,
} as const;

type AddressMap = Record<number, Address>;
type BigInt = Record<number, bigint>;

type AddressConfigValues = {
  MARKET_FACTORY: AddressMap;
  ROUTER: AddressMap;
  MARKET_VIEW: AddressMap;
  REALITIO: AddressMap;
  CONDITIONAL_TOKENS: AddressMap;
};

type BigIntConfigValues = {
  MIN_BOND: BigInt;
};

const ADDRESSES_CONFIG: AddressConfigValues = {
  MARKET_FACTORY: {
    [gnosis.id]: "0xab797c4c6022a401c31543e316d3cd04c67a87fc",
    [mainnet.id]: zeroAddress,
  },

  ROUTER: {
    [gnosis.id]: "0xfe8bf5140f00de6f75bafa3ca0f4ebf2084a46b2",
    [mainnet.id]: zeroAddress,
  },

  MARKET_VIEW: {
    [gnosis.id]: "0x12bb49deb8f293435e27f6f4ab140184604ce346",
    [mainnet.id]: zeroAddress,
  },

  REALITIO: {
    [gnosis.id]: "0xE78996A233895bE74a66F451f1019cA9734205cc",
    [mainnet.id]: "0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c",
  },

  CONDITIONAL_TOKENS: {
    [gnosis.id]: "0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce",
    [mainnet.id]: "0xC59b0e4De5F1248C1140964E0fF287B192407E0C",
  },
};

type CollateralTokensMap = Record<number, { primary: Token; secondary: Token | undefined }>;

export const COLLATERAL_TOKENS: CollateralTokensMap = {
  [gnosis.id]: {
    primary: { address: "0xaf204776c7245bf4147c2612bf6e5972ee483701", symbol: "sDAI", decimals: 18 },
    secondary: { address: NATIVE_TOKEN, symbol: "xDAI", decimals: 18 },
  },
  [mainnet.id]: {
    primary: { address: "0x83F20F44975D03b1b09e64809B757c47f942BEeA", symbol: "sDAI", decimals: 18 },
    secondary: { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", decimals: 18 },
  },
} as const;

const BIG_NUMBERS_CONFIG: BigIntConfigValues = {
  MIN_BOND: {
    [gnosis.id]: parseUnits("0.1", 18),
    [mainnet.id]: parseUnits("5", 18),
    [hardhat.id]: parseUnits("5", 18),
  },
};

export type RouterTypes = "mainnet" | "gnosis";

export const CHAIN_ROUTERS: Record<number, RouterTypes> = {
  [gnosis.id]: "gnosis",
  [hardhat.id]: "mainnet",
  [mainnet.id]: "mainnet",
} as const;

export const getConfigAddress = <T extends keyof AddressConfigValues>(configKey: T, chainId?: number): Address => {
  return ADDRESSES_CONFIG[configKey][chainId || DEFAULT_CHAIN];
};

export const getConfigNumber = <T extends keyof BigIntConfigValues>(configKey: T, chainId?: number): bigint => {
  return BIG_NUMBERS_CONFIG[configKey][chainId || DEFAULT_CHAIN];
};
