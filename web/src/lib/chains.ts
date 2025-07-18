import { Chain, gnosis as _gnosis, mainnet as _mainnet, hardhat, sepolia } from "wagmi/chains";
import SEER_ENV from "./env";

// override mainnet and gnosis here using defineChain() to test against a forked network
const mainnet = _mainnet;
const gnosis = _gnosis;

export { mainnet, gnosis, hardhat, sepolia };

export const SUPPORTED_CHAINS: Partial<
  Record<typeof gnosis.id | typeof mainnet.id | typeof sepolia.id /*| typeof hardhat.id*/, Chain>
> = {
  //...((SEER_ENV.VITE_ADD_HARDHAT_NETWORK === "1" ? { [hardhat.id]: hardhat } : ({} as Chain)) as Record<number, Chain>),
  ...((SEER_ENV.VITE_TESTNET_WEBSITE === "1" ? { [sepolia.id]: sepolia } : { [gnosis.id]: gnosis }) as Record<
    number,
    Chain
  >),
} as const satisfies Record<string, Chain>;

export type SupportedChain = keyof typeof SUPPORTED_CHAINS;

export const DEFAULT_CHAIN: SupportedChain = gnosis.id;

export function filterChain(chainId: number | undefined): SupportedChain {
  return chainId && chainId in SUPPORTED_CHAINS ? (chainId as SupportedChain) : DEFAULT_CHAIN;
}
