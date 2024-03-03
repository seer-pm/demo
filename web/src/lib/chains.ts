import { Chain, gnosis, hardhat, mainnet } from "wagmi/chains";

// used with wagmi generate
const wagmiCliProd = typeof process !== 'undefined' && typeof process.env.WAGMI_CLI_PROD !== 'undefined' && process.env.WAGMI_CLI_PROD === 'true'
// used with yarn build / yarn dev
const viteProd = typeof import.meta.env?.PROD !== 'undefined' && import.meta.env.PROD

export const SUPPORTED_CHAINS = {
  [gnosis.id]: gnosis,
  [mainnet.id]: mainnet,
  ...((!(wagmiCliProd || viteProd) ? { [hardhat.id]: hardhat } : ({} as Chain)) as Record<number, Chain>),
} as const satisfies Record<string, Chain>;

export type SupportedChain = keyof typeof SUPPORTED_CHAINS

export const DEFAULT_CHAIN: SupportedChain = gnosis.id;
