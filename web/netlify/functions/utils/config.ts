import { ChainId, configureRpcProviders } from "@swapr/sdk";
import { http, createConfig } from "wagmi";
import { base, gnosis, mainnet, optimism, sepolia } from "wagmi/chains";

export { gnosis, mainnet, optimism, base };

const GNOSIS_RPC = process.env.PRIVATE_RPC_GNOSIS || "https://gnosis-pokt.nodies.app";
const MAINNET_RPC = process.env.PRIVATE_RPC_MAINNET || "https://eth-pokt.nodies.app";
const OPTIMISM_RPC = process.env.PRIVATE_RPC_OPTIMISM || "https://mainnet.optimism.io";
const BASE_RPC = process.env.PRIVATE_RPC_BASE || "https://base.llamarpc.com";

configureRpcProviders({
  [ChainId.XDAI]: GNOSIS_RPC,
  [ChainId.MAINNET]: MAINNET_RPC,
  [ChainId.OPTIMISM_MAINNET]: OPTIMISM_RPC,
  [ChainId.BASE]: BASE_RPC,
});

// TODO: replace this
export const config = createConfig({
  chains: [mainnet, sepolia, gnosis, optimism, base],
  transports: {
    [mainnet.id]: http(MAINNET_RPC),
    [sepolia.id]: http(process.env.PRIVATE_RPC_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com"),
    [gnosis.id]: http(GNOSIS_RPC),
    [optimism.id]: http(OPTIMISM_RPC),
    [base.id]: http(BASE_RPC),
  },
});

export const chainIds = [mainnet.id, gnosis.id, optimism.id /*, base.id */, sepolia.id] as const;
