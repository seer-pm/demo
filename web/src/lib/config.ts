import { Address, Chain, parseUnits, zeroAddress } from "viem";
import { bsc, gnosis, goerli, hardhat, mainnet } from "viem/chains";
import { Token } from "./tokens";
import { NATIVE_TOKEN } from "./utils";

export const DEFAULT_CHAIN = goerli.id;

export const SUPPORTED_CHAINS: Record<number, Chain> = {
  [gnosis.id]: gnosis,
  [goerli.id]: goerli,
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
  POOL_INFORMATION: AddressMap;
  MAVERICK_ROUTER: AddressMap;
};

type BigIntConfigValues = {
  MIN_BOND: BigInt;
};

const ADDRESSES_CONFIG: AddressConfigValues = {
  MARKET_FACTORY: {
    [gnosis.id]: "0xab797c4c6022a401c31543e316d3cd04c67a87fc",
    [mainnet.id]: zeroAddress,
    [bsc.id]: "0x44921b4c7510fb306d8e58cf3894fa2bc8a79f00",
    [goerli.id]: "0xcb62878ac4b2e506dc690cde9e9d4cf78ccb91a6",
  },

  ROUTER: {
    [gnosis.id]: "0xfe8bf5140f00de6f75bafa3ca0f4ebf2084a46b2",
    [mainnet.id]: zeroAddress,
    [bsc.id]: "0xb2ab74afe47e6f9d8c392fa15b139ac02684771a",
    [goerli.id]: "0x50b8d283319a93fc0186e60ab78f5145d6327605",
  },

  MARKET_VIEW: {
    [gnosis.id]: "0x12bb49deb8f293435e27f6f4ab140184604ce346",
    [mainnet.id]: zeroAddress,
    [bsc.id]: "0x0956b70ac0eca45db9661a1cee96b2e7062d8a1c",
    [goerli.id]: "0xdf2e1829a65028228ab6c5d800b346ef2595f643",
  },

  REALITIO: {
    [gnosis.id]: "0xE78996A233895bE74a66F451f1019cA9734205cc",
    [mainnet.id]: "0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c",
    [bsc.id]: "0xa925646Cae3721731F9a8C886E5D1A7B123151B9",
    [goerli.id]: "0x6F80C5cBCF9FbC2dA2F0675E56A5900BB70Df72f",
  },

  CONDITIONAL_TOKENS: {
    [gnosis.id]: "0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce",
    [mainnet.id]: "0xC59b0e4De5F1248C1140964E0fF287B192407E0C",
    [bsc.id]: "0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E",
    [goerli.id]: "0x383e1Dd5D232516aFa1b1524d31B1EF6E9c6caFb",
  },

  POOL_INFORMATION: {
    [gnosis.id]: zeroAddress,
    [mainnet.id]: "0x0087D11551437c3964Dddf0F4FA58836c5C5d949",
    [bsc.id]: "0xB3916179619EEF2497C646e664Be6e13cd1AB445",
    [goerli.id]: "0x0Eb806b0daE0D9639A531F1eB820d8F94fB9E941",
  },

  MAVERICK_ROUTER: {
    [gnosis.id]: zeroAddress,
    [mainnet.id]: "0xbBF1EE38152E9D8e3470Dc47947eAa65DcA94913",
    [bsc.id]: "0xD53a9f3FAe2bd46D35E9a30bA58112A585542869",
    [goerli.id]: "0x9563Fdb01BFbF3D6c548C2C64E446cb5900ACA88",
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
  [bsc.id]: {
    primary: { address: "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3", symbol: "DAI", decimals: 18 },
    secondary: undefined,
  },
  [goerli.id]: {
    primary: { address: "0x65a5ba240cbd7fd75700836b683ba95ebb2f32bd", symbol: "DAI", decimals: 18 },
    secondary: { address: NATIVE_TOKEN, symbol: "ETH", decimals: 18 },
  },
} as const;

const BIG_NUMBERS_CONFIG: BigIntConfigValues = {
  MIN_BOND: {
    [gnosis.id]: parseUnits("0.1", 18),
    [mainnet.id]: parseUnits("5", 18),
    [goerli.id]: parseUnits("0.000001", 18),
    [bsc.id]: parseUnits("0.001", 18),
    [hardhat.id]: parseUnits("5", 18),
  },
};

export type RouterTypes = "base" | "mainnet" | "gnosis";

export const CHAIN_ROUTERS: Record<number, RouterTypes> = {
  [gnosis.id]: "gnosis",
  [hardhat.id]: "mainnet",
  [mainnet.id]: "mainnet",
  [bsc.id]: "base",
  [goerli.id]: "base",
} as const;

export const getConfigAddress = <T extends keyof AddressConfigValues>(configKey: T, chainId?: number): Address => {
  return ADDRESSES_CONFIG[configKey][chainId || DEFAULT_CHAIN];
};

export const getConfigNumber = <T extends keyof BigIntConfigValues>(configKey: T, chainId?: number): bigint => {
  return BIG_NUMBERS_CONFIG[configKey][chainId || DEFAULT_CHAIN];
};
