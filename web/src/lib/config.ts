import { Address, Chain, parseUnits, zeroAddress } from "viem";
import { gnosis, goerli, hardhat, mainnet } from "viem/chains";

export const DEFAULT_CHAIN = hardhat.id;

export const SUPPORTED_CHAINS: Record<number, Chain> = {
  [goerli.id]: goerli,
  [hardhat.id]: hardhat,
};

type AddressMap = Record<number, Address>;
type BigInt = Record<number, bigint>;

type AddressConfigValues = {
  MARKET_FACTORY: AddressMap;
  ROUTER: AddressMap;
  MARKET_VIEW: AddressMap;
  REALITIO: AddressMap;
  ALT_COLLATERAL: AddressMap;
};

type BigIntConfigValues = {
  MIN_BOND: BigInt;
};

const ADDRESSES_CONFIG: AddressConfigValues = {
  MARKET_FACTORY: {
    [goerli.id]: "0x25381667a57e9e0a78aa26dc2fb21e9105459a63",
    [hardhat.id]: "0x057cd3082efed32d5c907801bf3628b27d88fd80",
    [mainnet.id]: "0xad203b3144f8c09a20532957174fc0366291643c",
  },

  ROUTER: {
    [goerli.id]: zeroAddress,
    [hardhat.id]: "0xd73bab8f06db28c87932571f87d0d2c0fdf13d94",
    [mainnet.id]: zeroAddress,
  },

  MARKET_VIEW: {
    [goerli.id]: zeroAddress,
    [hardhat.id]: "0x31403b1e52051883f2ce1b1b4c89f36034e1221d",
    [mainnet.id]: zeroAddress,
  },

  REALITIO: {
    [goerli.id]: "0x6F80C5cBCF9FbC2dA2F0675E56A5900BB70Df72f",
    [hardhat.id]: "0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c",
    [mainnet.id]: "0x92115220C28e78312cCe86f3d1dE652CFBD0357A",
  },

  ALT_COLLATERAL: {
    [goerli.id]: zeroAddress,
    [hardhat.id]: "0x6b175474e89094c44da98b954eedeac495271d0f",
    [mainnet.id]: "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
  },
};

const BIG_NUMBERS_CONFIG: BigIntConfigValues = {
  MIN_BOND: {
    [goerli.id]: parseUnits("5", 18),
    [hardhat.id]: parseUnits("5", 18),
    [mainnet.id]: parseUnits("0.0001", 18),
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
