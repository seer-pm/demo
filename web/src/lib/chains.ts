import { Chain, gnosis, hardhat, mainnet } from "wagmi/chains";

export const DEFAULT_CHAIN = gnosis.id;

export const SUPPORTED_CHAINS: Record<number, Chain> = {
  [gnosis.id]: gnosis,
  [mainnet.id]: mainnet,
  //[goerli.id]: goerli,
  ...(!import.meta?.env?.PROD ? { [hardhat.id]: hardhat } : ({} as Chain)),
} as const;