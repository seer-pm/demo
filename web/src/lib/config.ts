import { gnosisRouterAddress, mainnetRouterAddress, routerAddress } from "@/hooks/contracts/generated";
import { Address, parseUnits } from "viem";
import { bsc, gnosis, goerli, hardhat, mainnet, sepolia } from "viem/chains";
import { DEFAULT_CHAIN, SupportedChain } from "./chains";
import { Token } from "./tokens";
import { NATIVE_TOKEN } from "./utils";

type BigInt = Record<number, bigint>;

type BigIntConfigValues = {
  MIN_BOND: BigInt;
};

type CollateralTokensMap = Record<number, { primary: Token; secondary: Token | undefined }>;

export const COLLATERAL_TOKENS: CollateralTokensMap = {
  [gnosis.id]: {
    primary: { address: "0xaf204776c7245bf4147c2612bf6e5972ee483701", symbol: "sDAI", decimals: 18 },
    secondary: {
      address: NATIVE_TOKEN,
      symbol: "xDAI",
      decimals: 18,
      wrapped: { address: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d", symbol: "wxDAI", decimals: 18 },
    },
  },
  [mainnet.id]: {
    primary: { address: "0x83F20F44975D03b1b09e64809B757c47f942BEeA", symbol: "sDAI", decimals: 18 },
    secondary: { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", decimals: 18 },
  },
  [bsc.id]: {
    primary: { address: "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3", symbol: "DAI", decimals: 18 },
    secondary: undefined,
  },
  [sepolia.id]: {
    primary: { address: "0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357", symbol: "DAI", decimals: 18 },
    secondary: undefined,
  },
  [hardhat.id]: {
    primary: { address: "0xaf204776c7245bf4147c2612bf6e5972ee483701", symbol: "sDAI", decimals: 18 },
    secondary: { address: NATIVE_TOKEN, symbol: "xDAI", decimals: 18 },
  },
} as const;

const BIG_NUMBERS_CONFIG: BigIntConfigValues = {
  MIN_BOND: {
    [gnosis.id]: parseUnits("0.1", 18),
    [mainnet.id]: parseUnits("5", 18),
    [goerli.id]: parseUnits("0.000001", 18),
    [sepolia.id]: parseUnits("0.000001", 18),
    [bsc.id]: parseUnits("0.001", 18),
    [hardhat.id]: parseUnits("5", 18),
  },
};

export type RouterTypes = "base" | "mainnet" | "gnosis";

export const CHAIN_ROUTERS: Record<number, RouterTypes> = {
  [gnosis.id]: "gnosis",
  [hardhat.id]: "gnosis",
  [mainnet.id]: "mainnet",
  [bsc.id]: "base",
  [sepolia.id]: "base",
  [goerli.id]: "base",
} as const;

export const SUBGRAPH_URLS: Partial<Record<SupportedChain, string>> = {
  [gnosis.id]: "https://api.thegraph.com/subgraphs/name/xyzseer/seer-pm",
};
export const CURATE_SUBGRAPH_URLS: Partial<Record<SupportedChain, string>> = {
  [gnosis.id]: "https://api.thegraph.com/subgraphs/name/kleros/legacy-curate-xdai",
};
export const SWAPR_ALGEBRA_SUBGRAPH_URLS: Partial<Record<SupportedChain, string>> = {
  [gnosis.id]: "https://api.thegraph.com/subgraphs/name/swaprhq/algebra-v19",
};
export const SWAPR_ALGEBRA_FARMING_SUBGRAPH_URLS: Partial<Record<SupportedChain, string>> = {
  [gnosis.id]: "https://api.thegraph.com/subgraphs/name/swaprhq/algebrafarming-v19",
};

export const getRouterAddress = (chainId?: SupportedChain): Address => {
  const addresses = Object.assign({}, gnosisRouterAddress, mainnetRouterAddress, routerAddress);
  return addresses[chainId || DEFAULT_CHAIN];
};

export const getConfigNumber = <T extends keyof BigIntConfigValues>(configKey: T, chainId?: number): bigint => {
  return BIG_NUMBERS_CONFIG[configKey][chainId || DEFAULT_CHAIN];
};
