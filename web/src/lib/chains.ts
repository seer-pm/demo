import type { SupportedChain, SupportedChains as SupportedChainsBase } from "@seer-pm/sdk";
import { Chain, gnosis as _gnosis, mainnet as _mainnet, base, hardhat, optimism, sepolia } from "wagmi/chains";
import SEER_ENV from "./env";

// override mainnet and gnosis here using defineChain() to test against a forked network
const mainnet = _mainnet;
const gnosis = _gnosis;

export { mainnet, gnosis, optimism, base, hardhat, sepolia };

type SupportedChains = SupportedChainsBase<Chain>;

export const SUPPORTED_CHAINS: SupportedChains =
  // ...((SEER_ENV.VITE_ADD_HARDHAT_NETWORK === "1" ? { [hardhat.id]: hardhat } : ({} as Chain)) as Record<number, Chain>),
  (
    SEER_ENV.VITE_IS_FAST_TESTNET === "1"
      ? { [gnosis.id]: gnosis }
      : SEER_ENV.VITE_TESTNET_WEBSITE === "1"
        ? { [sepolia.id]: sepolia }
        : { [gnosis.id]: gnosis, [mainnet.id]: mainnet, [optimism.id]: optimism, [base.id]: base }
  ) as SupportedChains;

export const DEFAULT_CHAIN: SupportedChain = gnosis.id;

export function filterChain(chainId: number | undefined): SupportedChain {
  return chainId && chainId in SUPPORTED_CHAINS ? (chainId as SupportedChain) : DEFAULT_CHAIN;
}
