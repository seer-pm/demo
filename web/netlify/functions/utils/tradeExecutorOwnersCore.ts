import { SEER_APP_ALL_ID } from "@/lib/apps";
import { type Address, type Hex, encodeAbiParameters, encodePacked, keccak256 } from "viem";
import { gnosis, optimism } from "viem/chains";
import { OldTradeExecutorBytecode, TradeExecutorBytecode, formatBytecode } from "./tradeExecutorBytecode";

export const TRADE_EXECUTOR_SALT_KEY = "TradeExecutorV1";

/** DeepFunding TradeExecutor factory on Optimism. */
export const OPTIMISM_TRADE_EXECUTOR_FACTORY = "0x6F6537809831605f6920eF623B9dd8a6036bbc60" as Address;

/** Foresight TradeExecutor factory on Gnosis (CreateCall). */
export const GNOSIS_TRADE_EXECUTOR_FACTORY = "0xBE202e30F21083619F9e8e62440CDe71903b94C4" as Address;

export type TradeExecutorChainConfig = {
  chainId: number;
  factory: Address;
  /** CREATE2 init bytecodes to probe for this chain. */
  bytecodes: readonly Hex[];
};

const OPTIMISM_BYTECODES = [formatBytecode(TradeExecutorBytecode), formatBytecode(OldTradeExecutorBytecode)] as const;

/** Foresight only deploys the owner-only (old) TradeExecutor. */
const GNOSIS_BYTECODES = [formatBytecode(OldTradeExecutorBytecode)] as const;

export const TRADE_EXECUTOR_CHAINS: Record<number, TradeExecutorChainConfig> = {
  [optimism.id]: {
    chainId: optimism.id,
    factory: OPTIMISM_TRADE_EXECUTOR_FACTORY,
    bytecodes: OPTIMISM_BYTECODES,
  },
  [gnosis.id]: {
    chainId: gnosis.id,
    factory: GNOSIS_TRADE_EXECUTOR_FACTORY,
    bytecodes: GNOSIS_BYTECODES,
  },
};

export const TRADE_EXECUTOR_CHAIN_IDS = Object.keys(TRADE_EXECUTOR_CHAINS).map(Number);

/** KV key in `key_value`. Format is stable (`…_${chainId}`); value is OwnerMapRecord. */
export function ownerMapKey(chainId: number): string {
  return `seer_pnl_leaderboard_owners_${chainId}`;
}

export function getTradeExecutorConfig(chainId: number): TradeExecutorChainConfig | undefined {
  return TRADE_EXECUTOR_CHAINS[chainId];
}

export function hasTradeExecutorConfig(chainId: number): boolean {
  return chainId in TRADE_EXECUTOR_CHAINS;
}

/**
 * Probe/expand TradeExecutors only for DeepFunding (Optimism), Foresight (Gnosis),
 * and protocol-wide `all` on those chains — not Opportunity or other apps.
 */
export function jobUsesTradeExecutors(appId: string, chainId: number): boolean {
  if (!hasTradeExecutorConfig(chainId)) return false;
  if (appId === SEER_APP_ALL_ID) return true;
  const colon = appId.indexOf(":");
  const app = colon < 0 ? appId : appId.slice(0, colon);
  if (app === "deepfund") return chainId === optimism.id;
  if (app === "foresight") return chainId === gnosis.id;
  return false;
}

export type OwnerMap = Record<string, string>;

/**
 * Collapse an address to the identity it should be ranked under. Unknown addresses — EOAs,
 * 7702-delegated EOAs, Safes, anything without an `owner()` — map to themselves.
 */
export function canonicalAddress(address: string, owners: OwnerMap): string {
  const lower = address.toLowerCase();
  return owners[lower] ?? lower;
}

/** The CREATE2 address deploy would produce for this owner, bytecode, and factory. */
export function predictExecutorAddress(owner: Address, bytecode: Hex, factory: Address): Address {
  const constructorData = encodeAbiParameters([{ type: "address" }], [owner]);
  const deploymentData = `${bytecode}${constructorData.slice(2)}` as Hex;
  const salt = keccak256(encodePacked(["string", "address"], [TRADE_EXECUTOR_SALT_KEY, owner]));
  const hash = keccak256(
    encodePacked(["bytes1", "address", "bytes32", "bytes32"], ["0xff", factory, salt, keccak256(deploymentData)]),
  );
  return `0x${hash.slice(-40)}` as Address;
}

export function predictedExecutorsForOwner(owner: string, config: TradeExecutorChainConfig): string[] {
  const ownerLc = owner.toLowerCase();
  const out: string[] = [];
  for (const bytecode of config.bytecodes) {
    const executor = predictExecutorAddress(ownerLc as Address, bytecode, config.factory).toLowerCase();
    if (executor !== ownerLc) out.push(executor);
  }
  return out;
}
