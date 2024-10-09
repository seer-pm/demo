import { Chain, gnosis as _gnosis, mainnet as _mainnet, hardhat /*, sepolia*/ } from "wagmi/chains";

// override mainnet and gnosis here using defineChain() to test against a forked network
const mainnet = _mainnet;
const gnosis = _gnosis;

export { mainnet, gnosis, hardhat };

export const SUPPORTED_CHAINS = {
  [gnosis.id]: gnosis,
  [mainnet.id]: mainnet,
  //[sepolia.id]: sepolia,
  ...((import.meta.env.VITE_ADD_HARDHAT_NETWORK === "1" ? { [hardhat.id]: hardhat } : ({} as Chain)) as Record<
    number,
    Chain
  >),
} as const satisfies Record<string, Chain>;

export type SupportedChain = keyof typeof SUPPORTED_CHAINS;

export const DEFAULT_CHAIN: SupportedChain = gnosis.id;
