/**
 * Shared dRPC endpoints. Kept dependency-free so the Netlify functions can import it too — the
 * frontend's `wagmiConfig` pulls in web3modal and is not importable from the server side.
 */
const rpcEndpoint = (chain: string) => `https://lb.drpc.org/${chain}/As_mVw7_50IPk85yNYubcezE_O23TT8R8JDnrqRhf0fE`;

export const GNOSIS_RPC = rpcEndpoint("gnosis");
export const MAINNET_RPC = rpcEndpoint("ethereum");
export const OPTIMISM_RPC = rpcEndpoint("optimism");
export const BASE_RPC = rpcEndpoint("base");
export const ARBITRUM_RPC = rpcEndpoint("arbitrum");
