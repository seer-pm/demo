import { http, createConfig } from "wagmi";
import { base, gnosis, mainnet, optimism, sepolia } from "wagmi/chains";

export { gnosis, mainnet, optimism, base };

// TODO: replace this
export const config = createConfig({
  chains: [mainnet, sepolia, gnosis, optimism, base],
  transports: {
    [mainnet.id]: http(process.env.PRIVATE_RPC_MAINNET || "https://eth-pokt.nodies.app"),
    [sepolia.id]: http(process.env.PRIVATE_RPC_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com"),
    [gnosis.id]: http(process.env.PRIVATE_RPC_GNOSIS || "https://gnosis-pokt.nodies.app"),
    [optimism.id]: http(process.env.PRIVATE_RPC_OPTIMISM || "https://mainnet.optimism.io"),
    [base.id]: http(process.env.PRIVATE_RPC_BASE || "https://base.llamarpc.com"),
  },
});

export const chainIds = [mainnet.id, gnosis.id, optimism.id /*, base.id */, sepolia.id] as const;
