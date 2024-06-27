import { Chain, gnosis, hardhat, mainnet, sepolia } from "wagmi/chains";

export const SUPPORTED_CHAINS = {
  [gnosis.id]: gnosis,
  [mainnet.id]: mainnet,
  [sepolia.id]: sepolia,
  ...((import.meta.env.VITE_ADD_HARDHAT_NETWORK === "1" ? { [hardhat.id]: hardhat } : ({} as Chain)) as Record<
    number,
    Chain
  >),
} as const satisfies Record<string, Chain>;

export type SupportedChain = keyof typeof SUPPORTED_CHAINS;

export const DEFAULT_CHAIN: SupportedChain = gnosis.id;
