import { type Address, type Hex, encodeAbiParameters, encodePacked, keccak256 } from "viem";
import { optimism } from "viem/chains";
import { OldTradeExecutorBytecode, TradeExecutorBytecode, formatBytecode } from "./tradeExecutorBytecode";

/** DeepFunding TradeExecutor factory on Optimism (Gnosis CreateCall). */
export const TRADE_EXECUTOR_CREATE_FACTORY = "0x6F6537809831605f6920eF623B9dd8a6036bbc60" as Address;

export const TRADE_EXECUTOR_SALT_KEY = "TradeExecutorV1";

export const TRADE_EXECUTOR_CHAIN_ID = optimism.id;

export const OWNER_MAP_KEY = `seer_pnl_leaderboard_owners_${TRADE_EXECUTOR_CHAIN_ID}`;

export type OwnerMap = Record<string, string>;

/**
 * Collapse an address to the identity it should be ranked under. Unknown addresses — EOAs,
 * 7702-delegated EOAs, Safes, anything without an `owner()` — map to themselves.
 */
export function canonicalAddress(address: string, owners: OwnerMap): string {
  const lower = address.toLowerCase();
  return owners[lower] ?? lower;
}

/** The CREATE2 address DeepFunding deploy would produce for this owner and bytecode. */
export function predictExecutorAddress(owner: Address, bytecode: Hex): Address {
  const constructorData = encodeAbiParameters([{ type: "address" }], [owner]);
  const deploymentData = `${bytecode}${constructorData.slice(2)}` as Hex;
  const salt = keccak256(encodePacked(["string", "address"], [TRADE_EXECUTOR_SALT_KEY, owner]));
  const hash = keccak256(
    encodePacked(
      ["bytes1", "address", "bytes32", "bytes32"],
      ["0xff", TRADE_EXECUTOR_CREATE_FACTORY, salt, keccak256(deploymentData)],
    ),
  );
  return `0x${hash.slice(-40)}` as Address;
}

export const EXECUTOR_BYTECODES = [
  formatBytecode(TradeExecutorBytecode),
  formatBytecode(OldTradeExecutorBytecode),
] as const;
