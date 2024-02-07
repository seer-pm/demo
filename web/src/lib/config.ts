import { Address, Chain, parseUnits, zeroAddress } from "viem";
import { goerli, hardhat, mainnet } from "viem/chains";

export const DEFAULT_CHAIN = hardhat.id;

export const SUPPORTED_CHAINS: Record<number, Chain> = {
  [goerli.id]: goerli,
  [hardhat.id]: hardhat,
};

type AddressMap = Record<number, Address>;
type BigInt = Record<number, bigint>;

type AddressConfigValues = {
  MARKET_FACTORY: AddressMap;
  MARKET_VIEW: AddressMap;
  REALITIO: AddressMap;
};

type BigIntConfigValues = {
  MIN_BOND: BigInt;
};

const ADDRESSES_CONFIG: AddressConfigValues = {
  MARKET_FACTORY: {
    [goerli.id]: "0x25381667a57e9e0a78aa26dc2fb21e9105459a63",
    [hardhat.id]: "0x25381667a57e9e0a78aa26dc2fb21e9105459a63",
    [mainnet.id]: "0xFE6bd7451E92DeddD1096430e659e8af882D2eb7",
  },

  MARKET_VIEW: {
    [goerli.id]: zeroAddress,
    [hardhat.id]: "0xe347906d61bb628430aeb9b27dbc56a788823005",
    [mainnet.id]: zeroAddress,
  },

  REALITIO: {
    [goerli.id]: "0x6F80C5cBCF9FbC2dA2F0675E56A5900BB70Df72f",
    [hardhat.id]: "0x6F80C5cBCF9FbC2dA2F0675E56A5900BB70Df72f",
    [mainnet.id]: "0x92115220C28e78312cCe86f3d1dE652CFBD0357A",
  },
};

const BIG_NUMBERS_CONFIG: BigIntConfigValues = {
  MIN_BOND: {
    [goerli.id]: parseUnits("5", 18),
    [hardhat.id]: parseUnits("5", 18),
    [mainnet.id]: parseUnits("0.0001", 18),
  },
};

export const getConfigAddress = <T extends keyof AddressConfigValues>(configKey: T, chainId?: number): Address => {
  return ADDRESSES_CONFIG[configKey][chainId || DEFAULT_CHAIN];
};

export const getConfigNumber = <T extends keyof BigIntConfigValues>(configKey: T, chainId?: number): bigint => {
  return BIG_NUMBERS_CONFIG[configKey][chainId || DEFAULT_CHAIN];
};
