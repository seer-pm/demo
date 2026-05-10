import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { http, fallback } from "wagmi";
import { type Chain, sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { SUPPORTED_CHAINS, base, gnosis, hardhat, mainnet, optimism } from "./lib/chains";
import SEER_ENV from "./lib/env";

const rpcEndpoint = (chain: string) => `https://lb.drpc.org/${chain}/As_mVw7_50IPk85yNYubcezE_O23TT8R8JDnrqRhf0fE`;
export const GNOSIS_RPC = rpcEndpoint("gnosis");
export const MAINNET_RPC = rpcEndpoint("ethereum");
export const OPTIMISM_RPC = rpcEndpoint("optimism");
export const BASE_RPC = rpcEndpoint("base");
export const ARBITRUM_RPC = rpcEndpoint("arbitrum");

const metadata = {
  name: "Seer",
  description: "Prediction Markets",
  url: "https://web3modal.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

export const connectors = [injected(), walletConnect({ projectId: SEER_ENV.VITE_WC_PROJECT_ID!, showQrModal: false })];

export const config = defaultWagmiConfig({
  metadata,
  projectId: SEER_ENV.VITE_WC_PROJECT_ID!,
  chains: Object.values(SUPPORTED_CHAINS) as unknown as [Chain, ...Chain[]],
  connectors,
  enableCoinbase: false,
  transports: {
    [gnosis.id]: fallback([http(GNOSIS_RPC), http("https://rpc.gnosischain.com")]),
    [mainnet.id]: fallback([http(MAINNET_RPC), http("https://eth-pokt.nodies.app")]),
    [optimism.id]: fallback([http(OPTIMISM_RPC), http("https://mainnet.optimism.io")]),
    [base.id]: fallback([http(BASE_RPC), http("https://base.llamarpc.com")]),
    [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com"),
    [hardhat.id]: http(),
  },
  ssr: true,
});
