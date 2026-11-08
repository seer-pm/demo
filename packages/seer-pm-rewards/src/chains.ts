import type { Address, Chain } from "viem";
import { base, gnosis, mainnet, optimism } from "viem/chains";

export type SourceChain = {
  chain: Chain;
  /** Same variable names the Netlify functions read; viem's public RPC is the fallback. */
  rpcEnv: string;
  poolManager: Address;
  positionManager: Address;
  /**
   * Block the Seer `LimitOrderHook` was deployed in (`contracts/deployments/<chain>/LimitOrderHook.json`).
   * Every Seer pool uses that hook, so no pool can be initialized earlier and logs are read from here.
   */
  fromBlock: bigint;
};

/**
 * Chains with Seer V4 pools. The PoolManager and PositionManager addresses are Uniswap's canonical
 * deployments, the same ones `@seer-pm/order-book` uses (`order-book-config.ts`).
 */
export const SOURCE_CHAINS: Record<number, SourceChain> = {
  [mainnet.id]: {
    chain: mainnet,
    rpcEnv: "PRIVATE_RPC_MAINNET",
    poolManager: "0x000000000004444c5dc75cB358380D2e3dE08A90",
    positionManager: "0xbd216513d74c8cf14cf4747e6aaa6420ff64ee9e",
    fromBlock: 25648430n,
  },
  [optimism.id]: {
    chain: optimism,
    rpcEnv: "PRIVATE_RPC_OPTIMISM",
    poolManager: "0x9a13f98cb987694c9f086b1f5eb990eea8264ec3",
    positionManager: "0x3c3ea4b57a46241e54610e5f022e5c45859a1017",
    fromBlock: 154924498n,
  },
  [base.id]: {
    chain: base,
    rpcEnv: "PRIVATE_RPC_BASE",
    poolManager: "0x498581ff718922c3f8e6a244956af099b2652b2b",
    positionManager: "0x7c5f5a4bbd8fd63184577525326123b519429bdc",
    fromBlock: 49329207n,
  },
};

/** Chains a campaign may pay out on: any source chain, or Gnosis where SER-lpp already lives. */
export const PAYOUT_CHAIN_IDS: readonly number[] = [mainnet.id, optimism.id, base.id, gnosis.id];
