import { type Address, type Chain, zeroAddress } from "viem";
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

export type PayoutChain = {
  chain: Chain;
  rpcEnv: string;
  /**
   * The chain's Morpho Universal Rewards Distributor and the block it was deployed in, from which
   * the bot reads its root history. Unset until it is deployed; the bot skips the chain until then.
   */
  distributor?: { address: Address; fromBlock: bigint };
  /**
   * The chain's `RewardCampaigns` registry (`contracts/src/rewards/RewardCampaigns.sol`), which holds the
   * campaigns paying out here and escrows their budgets, and the block it was deployed in, from which the bot
   * reads its events. Unset until it is deployed; the chain has no campaigns until then.
   */
  registry?: { address: Address; fromBlock: bigint };
};

// A zero address marks a pending deployment. Consumers skip chains without a registry.
const registry = (address: Address, fromBlock: bigint) => (address === zeroAddress ? undefined : { address, fromBlock });

/**
 * SER-lpp ("Seer LP Point") on each chain: the Ethereum token, its OmniBridge copy on Gnosis and its OP Standard
 * Bridge copies on Optimism and Base (`remoteToken` is the Ethereum one). The airdrop reads its holders, and a new
 * reward campaign takes it as its default reward token.
 */
export const SER_LPP: Record<number, Address> = {
  [mainnet.id]: "0xd14ef697281404646d8e2437a0050794a6a22fd6",
  [gnosis.id]: "0xa7a7f8d1770c08e2e1f55d8c6427c1f8213a34da",
  [optimism.id]: "0x5ee89A5E2b4c9204f0f42c6dF4aE1B226e862afD",
  [base.id]: "0x813e4F03eAd3A106409b67bec6F91C34e2A489B9",
};

/** Chains rewards pay out on: the source chains, since a campaign pays out on its pool's chain in that chain's token. */
export const PAYOUT_CHAINS: Record<number, PayoutChain> = {
  [mainnet.id]: {
    chain: mainnet,
    rpcEnv: "PRIVATE_RPC_MAINNET",
    distributor: { address: "0x64d89bb0e7BdB71f81E9bdA770036a9139B284AB", fromBlock: 26416221n },
    registry: registry("0xa6E4286C32E68679181bEacAA8384894550C6f06", 26453819n),
  },
  [optimism.id]: {
    chain: optimism,
    rpcEnv: "PRIVATE_RPC_OPTIMISM",
    distributor: { address: "0x880e41A11451a2DC6783997E94dab75D66eBbCfB", fromBlock: 159548304n },
    registry: registry("0xf7E64845A8737466CAD5687fFD718eF242E6e9aF", 159774519n),
  },
  [base.id]: {
    chain: base,
    rpcEnv: "PRIVATE_RPC_BASE",
    distributor: { address: "0x34d7c267f4c2Faf52E0eB514A314C99aE3ACeE37", fromBlock: 57525130n },
    registry: registry("0x7563C95e6837D3256162eCAa7B5984681515eAa3", 59787169n),
  },
};
