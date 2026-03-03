import type { Address } from "viem";
import { base, gnosis, mainnet, optimism } from "viem/chains";

/** DEX swap router addresses (Swapr on Gnosis, Uniswap V3 on Ethereum/Base/Optimism). */
const SWAP_ROUTER_ADDRESSES: Record<number, Address> = {
  [gnosis.id]: "0xffb643e73f280b97809a8b41f7232ab401a04ee1", // Swapr (Gnosis)
  [mainnet.id]: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // Uniswap V3 (Ethereum)
  [base.id]: "0x2626664c2603336E57B271c5C0b26F421741e481", // Uniswap V3 (Base)
  [optimism.id]: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // Uniswap V3 (Optimism)
};

/**
 * Returns the DEX swap router address for the given chain (Swapr on Gnosis, Uniswap V3 elsewhere).
 * Use this for building swap transactions (exactInputSingle / exactOutputSingle).
 */
export function getSwapRouterAddress(chainId: number): Address {
  const address = SWAP_ROUTER_ADDRESSES[chainId];
  if (!address) {
    throw new Error(`No swap router for chain ${chainId}`);
  }
  return address;
}
