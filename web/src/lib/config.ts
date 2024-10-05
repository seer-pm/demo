import * as generatedHooks from "@/hooks/contracts/generated";
// to make it work even if generatedHooks.routerAddress doesn't exist (e.g. if we are testing with a non-forked hardhat node)
const { gnosisRouterAddress, mainnetRouterAddress, ...restGeneratedHooks } = generatedHooks;
import { Address, parseUnits } from "viem";
import { hardhat, sepolia } from "viem/chains";
import { DEFAULT_CHAIN, SupportedChain, gnosis, mainnet } from "./chains";
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
    [gnosis.id]: parseUnits("10", 18),
    [mainnet.id]: parseUnits("0.02", 18),
    [sepolia.id]: parseUnits("0.000001", 18),
    [hardhat.id]: parseUnits("5", 18),
  },
};

export const SWAPR_CONFIG: Partial<
  Record<SupportedChain, { FARMING_CENTER: Address; NON_FUNGIBLE_POSITION_MANAGER: Address }>
> = {
  [gnosis.id]: {
    FARMING_CENTER: "0xde51ddf1ae7d5bbd7bf1a0e40aaa1f6c12579106",
    NON_FUNGIBLE_POSITION_MANAGER: "0x91fd594c46d8b01e62dbdebed2401dde01817834",
  },
};

export type RouterTypes = "base" | "mainnet" | "gnosis";

export const CHAIN_ROUTERS: Record<number, RouterTypes> = {
  [gnosis.id]: "gnosis",
  [hardhat.id]: "gnosis",
  [mainnet.id]: "mainnet",
  [sepolia.id]: "base",
} as const;

export const getRouterAddress = (chainId?: SupportedChain): Address => {
  const addresses = Object.assign(
    {},
    gnosisRouterAddress,
    mainnetRouterAddress,
    // biome-ignore lint/suspicious/noExplicitAny:
    (restGeneratedHooks as any)?.routerAddress || {},
  );
  return addresses[chainId || DEFAULT_CHAIN];
};

export const getConfigNumber = <T extends keyof BigIntConfigValues>(configKey: T, chainId?: number): bigint => {
  return BIG_NUMBERS_CONFIG[configKey][chainId || DEFAULT_CHAIN];
};

export const getLiquidityUrl = (chainId: number, token1: string, token2: string) => {
  switch (chainId) {
    case gnosis.id:
      return `https://v3.swapr.eth.limo/#/add/${token1}/${token2}/enter-amounts`;
    case mainnet.id:
      return `https://bunni.pro/add/ethereum?tokenA=${token1}&tokenB=${token2}`;
    default:
      return "#";
  }
};

export const getFarmingUrl = (chainId: number, farmId: string) => {
  switch (chainId) {
    case gnosis.id:
      return `https://v3.swapr.eth.limo/#/farming/farms#${farmId}`;
    case mainnet.id:
      return "#";
    default:
      return "#";
  }
};
