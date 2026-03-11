import { Market, getLiquidityPair, isOpStack } from "@seer-pm/sdk";
import type { SupportedChain } from "@seer-pm/sdk";
import { Address, parseUnits } from "viem";
import { hardhat, sepolia } from "viem/chains";
import { DEFAULT_CHAIN, base, gnosis, mainnet, optimism } from "./chains";

type BigInt = Record<number, bigint>;

type BigIntConfigValues = {
  MIN_BOND: BigInt;
};

const BIG_NUMBERS_CONFIG: BigIntConfigValues = {
  MIN_BOND: {
    [gnosis.id]: parseUnits("10", 18),
    [mainnet.id]: parseUnits("0.02", 18),
    [optimism.id]: parseUnits("0.0005", 18),
    [base.id]: parseUnits("0.0005", 18),
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

/** PSM3 contract for sUSDS <-> USDC/USDS on Optimism and Base */
export const PSM3_ADDRESS: Partial<Record<SupportedChain, Address>> = {
  [optimism.id]: "0xe0F9978b907853F354d79188A3dEfbD41978af62",
  [base.id]: "0x1601843c5E9bC251A3272907010AFa41Fa18347E",
};

export const getConfigNumber = <T extends keyof BigIntConfigValues>(configKey: T, chainId?: number): bigint => {
  return BIG_NUMBERS_CONFIG[configKey][chainId || DEFAULT_CHAIN];
};

function getUniswapLiquidityUrl(chainId: number, token1: string, token2: string) {
  const chainName = chainId === optimism.id ? "optimism" : "base";
  return `https://app.uniswap.org/positions/create/v3?step=0&currencyA=${token1}&currencyB=${token2}&chain=${chainName}&hook=undefined&priceRangeState={%22priceInverted%22:false,%22fullRange%22:true,%22minPrice%22:%22%22,%22maxPrice%22:%22%22,%22initialPrice%22:%22%22}&depositState={%22exactField%22:%22TOKEN0%22,%22exactAmounts%22:{}}&fee={%22feeAmount%22:100,%22tickSpacing%22:1,%22isDynamic%22:false}`;
}

export const getLiquidityUrl = (chainId: number, token1: string, token2: string) => {
  switch (chainId) {
    case gnosis.id:
      return `https://v3.swapr.eth.limo/#/add/${token1}/${token2}/enter-amounts`;
    case mainnet.id:
      return `https://bunni.pro/add/ethereum?tokenA=${token1}&tokenB=${token2}&fee=3000`;
    case optimism.id:
    case base.id:
      return getUniswapLiquidityUrl(chainId, token1, token2);
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
    case optimism.id:
      return `https://app.uniswap.org/explore/pools/optimism/${poolId}`;
    case base.id:
      return `https://app.uniswap.org/explore/pools/base/${poolId}`;
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
  return !isOpStack(chainId);
}

export const NETWORK_ICON_MAPPING: { [key: number]: string } = {
  [gnosis.id]: "/assets/images/gnosis.webp",
  [mainnet.id]: "/assets/images/ethereum.webp",
  [optimism.id]: "/assets/images/optimism.webp",
  [base.id]: "/assets/images/base.webp",
  [sepolia.id]: "/assets/images/ethereum.webp",
};
