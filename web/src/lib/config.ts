import {
  futarchyRouterAddress,
  gnosisRouterAddress,
  mainnetRouterAddress,
  routerAddress,
} from "@/hooks/contracts/generated-router";
import { Address, parseUnits } from "viem";
import { hardhat, sepolia } from "viem/chains";
import { DEFAULT_CHAIN, SupportedChain, gnosis, mainnet, optimism } from "./chains";
import { Market, getLiquidityPair } from "./market";
import { Token } from "./tokens";
import { NATIVE_TOKEN } from "./utils";

type BigInt = Record<number, bigint>;

type BigIntConfigValues = {
  MIN_BOND: BigInt;
};

type CollateralTokensMap = Record<SupportedChain, { primary: Token; secondary: Token | undefined }>;

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
  [optimism.id]: {
    primary: { address: "0xb5b2dc7fd34c249f4be7fb1fcea07950784229e0", symbol: "sUSDS", decimals: 18 },
    secondary: undefined,
  },
  [sepolia.id]: {
    primary: { address: "0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357", symbol: "DAI", decimals: 18 },
    secondary: undefined,
  },
  // [hardhat.id]: {
  //   primary: { address: "0xaf204776c7245bf4147c2612bf6e5972ee483701", symbol: "sDAI", decimals: 18 },
  //   secondary: { address: NATIVE_TOKEN, symbol: "xDAI", decimals: 18 },
  // },
} as const;

const BIG_NUMBERS_CONFIG: BigIntConfigValues = {
  MIN_BOND: {
    [gnosis.id]: parseUnits("10", 18),
    [mainnet.id]: parseUnits("0.02", 18),
    [optimism.id]: parseUnits("10", 18),
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
  [optimism.id]: "base",
  [sepolia.id]: "base",
} as const;

export const getRouterAddress = (market: Market): Address => {
  if (market.type === "Futarchy") {
    // @ts-ignore
    return futarchyRouterAddress[market.chainId];
  }

  const addresses = Object.assign({}, gnosisRouterAddress, mainnetRouterAddress, routerAddress);
  return addresses[market.chainId || DEFAULT_CHAIN];
};

export const getConfigNumber = <T extends keyof BigIntConfigValues>(configKey: T, chainId?: number): bigint => {
  return BIG_NUMBERS_CONFIG[configKey][chainId || DEFAULT_CHAIN];
};

export const getLiquidityUrl = (chainId: number, token1: string, token2: string) => {
  switch (chainId) {
    case gnosis.id:
      return `https://v3.swapr.eth.limo/#/add/${token1}/${token2}/enter-amounts`;
    case mainnet.id:
      return `https://bunni.pro/add/ethereum?tokenA=${token1}&tokenB=${token2}&fee=3000`;
    case optimism.id:
      return `https://app.uniswap.org/positions/create?step=0&currencyA=${token1}&currencyB=${token2}&chain=optimism`;
    default:
      return "#";
  }
};

export const getLiquidityUrlByMarket = (market: Market, outcomeIndex: number) => {
  const liquidityPair = getLiquidityPair(market, outcomeIndex);

  return getLiquidityUrl(market.chainId, liquidityPair.token0, liquidityPair.token1);
};

export const getPoolUrl = (chainId: number, poolId: string) => {
  switch (chainId) {
    case gnosis.id:
      return `https://v3.swapr.eth.limo/#/info/pools/${poolId}`;
    case mainnet.id:
      return `https://bunni.pro/pools/ethereum/${poolId}`;
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

export const getPositionUrl = (chainId: number, farmId: string) => {
  switch (chainId) {
    case gnosis.id:
      return `https://v3.swapr.eth.limo/#/pool/${farmId}`;
    case mainnet.id:
      return "#";
    default:
      return "#";
  }
};

export function isVerificationEnabled(chainId: SupportedChain) {
  return chainId !== optimism.id;
}

export const NETWORK_ICON_MAPPING: { [key: number]: string } = {
  [gnosis.id]: "/assets/images/gnosis.webp",
  [mainnet.id]: "/assets/images/ethereum.webp",
  [optimism.id]: "/assets/images/optimism.webp",
  [sepolia.id]: "/assets/images/ethereum.webp",
};
