import { Chain, gnosis as _gnosis, mainnet as _mainnet, hardhat, sepolia } from "wagmi/chains";

// override mainnet and gnosis here using defineChain() to test against a forked network
const mainnet = _mainnet;
const gnosis = _gnosis;

export { mainnet, gnosis, hardhat, sepolia };

export const SUPPORTED_CHAINS: Record<typeof gnosis.id | typeof mainnet.id, Chain> &
  Partial<Record<typeof sepolia.id | typeof hardhat.id, Chain>> = {
  [gnosis.id]: gnosis,
  [mainnet.id]: mainnet,
  ...((import.meta.env.VITE_ADD_HARDHAT_NETWORK === "1" ? { [hardhat.id]: hardhat } : ({} as Chain)) as Record<
    number,
    Chain
  >),
  ...((import.meta.env.VITE_TESTNET_WEBSITE === "1" ? { [sepolia.id]: sepolia } : ({} as Chain)) as Record<
    number,
    Chain
  >),
} as const;

export type SupportedChain = keyof typeof SUPPORTED_CHAINS;

export const DEFAULT_CHAIN: SupportedChain = gnosis.id;
