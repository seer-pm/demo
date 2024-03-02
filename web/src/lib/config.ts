import { Address, parseUnits } from "viem";
import { bsc, gnosis, goerli, hardhat, mainnet } from "viem/chains";
import { ADDRESSES_CONFIG, AddressConfigValues } from "./addresses";
import { Token } from "./tokens";
import { NATIVE_TOKEN } from "./utils";
import { DEFAULT_CHAIN } from "./chains";

type BigInt = Record<number, bigint>;

type BigIntConfigValues = {
  MIN_BOND: BigInt;
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
  if (configKey === 'Router') {
    if(CHAIN_ROUTERS[chainId || DEFAULT_CHAIN] === 'gnosis') {
      return ADDRESSES_CONFIG['GnosisRouter'][chainId || DEFAULT_CHAIN];
    }
    if(CHAIN_ROUTERS[chainId || DEFAULT_CHAIN] === 'mainnet') {
      return ADDRESSES_CONFIG['MainnetRouter'][chainId || DEFAULT_CHAIN];
    }
    if(CHAIN_ROUTERS[chainId || DEFAULT_CHAIN] === 'base') {
      return ADDRESSES_CONFIG['Router'][chainId || DEFAULT_CHAIN];
    }
  }

  return ADDRESSES_CONFIG[configKey][chainId || DEFAULT_CHAIN];
};

export const getConfigNumber = <T extends keyof BigIntConfigValues>(configKey: T, chainId?: number): bigint => {
  return BIG_NUMBERS_CONFIG[configKey][chainId || DEFAULT_CHAIN];
};

// add hardhat
/*const cloneChain = gnosis.id;
SUPPORTED_CHAINS[hardhat.id] = hardhat;
ADDRESSES_CONFIG.MarketFactory[hardhat.id] = "0xe38b6847e611e942e6c80ed89ae867f522402e80"; //ADDRESSES_CONFIG.MARKET_FACTORY[cloneChain];
//ADDRESSES_CONFIG.Router[hardhat.id] = "0x2c8ed11fd7a058096f2e5828799c68be88744e2f"; //ADDRESSES_CONFIG.ROUTER[cloneChain];
ADDRESSES_CONFIG.MarketView[hardhat.id] = "0x7580708993de7ca120e957a62f26a5ddd4b3d8ac"; //ADDRESSES_CONFIG.MARKET_VIEW[cloneChain];
ADDRESSES_CONFIG.Reality[hardhat.id] = ADDRESSES_CONFIG.Reality[cloneChain];
ADDRESSES_CONFIG.ConditionalTokens[hardhat.id] = ADDRESSES_CONFIG.ConditionalTokens[cloneChain];
CHAIN_ROUTERS[hardhat.id] = CHAIN_ROUTERS[cloneChain];
COLLATERAL_TOKENS[hardhat.id] = COLLATERAL_TOKENS[cloneChain];*/
