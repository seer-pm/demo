// Browser-safe part of the package: what a claim UI needs to read a distributor and its published
// file and to call `claim`. It must not import the engine, the event fetcher or the merkle tree.
import { base58 } from "@scure/base";
import { type Address, type Hex, concat, getAddress, hexToBytes, parseAbi, toHex } from "viem";
import type { Distribution } from "./distribution.ts";

export { PAYOUT_CHAINS, type PayoutChain } from "./chains.ts";
export type { Distribution } from "./distribution.ts";
export type { RewardsFile } from "./week.ts";

/** The parts of the Morpho Universal Rewards Distributor the bot and the UI use. */
export const urdAbi = parseAbi([
  "function root() view returns (bytes32)",
  "function ipfsHash() view returns (bytes32)",
  "function pendingRoot() view returns (bytes32 root, bytes32 ipfsHash, uint256 validAt)",
  "function claimed(address account, address reward) view returns (uint256)",
  "function claim(address account, address reward, uint256 claimable, bytes32[] proof) returns (uint256 amount)",
  "function submitRoot(bytes32 newRoot, bytes32 newIpfsHash)",
  "function acceptRoot()",
  "event PendingRootSet(address indexed caller, bytes32 indexed newRoot, bytes32 indexed newIpfsHash)",
  "event PendingRootRevoked(address indexed caller)",
]);

/** Gateway of the Kleros IPFS node the bot pins to; it answers with `Access-Control-Allow-Origin: *`. */
export const IPFS_GATEWAY = "https://cdn.kleros.link/ipfs/";

/**
 * The distributor's `ipfsHash` is the sha256 digest of the file's CIDv0, so anyone can find the
 * file behind a root: CID = base58(0x1220 ‖ ipfsHash).
 */
export function bytes32ToCid(hash: Hex): string {
  return base58.encode(hexToBytes(concat(["0x1220", hash])));
}

export function cidToBytes32(cid: string): Hex {
  const bytes = base58.decode(cid.replace(/^\/ipfs\//, ""));
  if (bytes.length !== 34 || bytes[0] !== 0x12 || bytes[1] !== 0x20) throw new Error(`${cid} is not a CIDv0`);
  return toHex(bytes.slice(2));
}

/** One reward token of one account on one distributor. */
export type AccountReward = {
  token: Address;
  /**
   * Cumulative amount in the active root's leaf. `claim` takes this amount, not `claimable`; the
   * distributor pays the difference with what was already claimed.
   */
  earned: bigint;
  proof: Hex[];
  claimed: bigint;
  /** What a `claim` would pay now. */
  claimable: bigint;
  /** What the pending root adds once its timelock ends. */
  upcoming: bigint;
};

const leafOf = (file: Distribution | undefined, account: Address, token: Address) => file?.claims[account]?.[token];

/** Tokens `account` has a leaf for in the active or the pending distribution. */
export function accountTokens(account: Address, ...files: (Distribution | undefined)[]): Address[] {
  const key = getAddress(account);
  return [...new Set(files.flatMap((file) => Object.keys(file?.claims[key] ?? {})))] as Address[];
}

/**
 * Rewards of `account` given the active distribution, the pending one if any, and what the
 * distributor says it already claimed per token.
 */
export function accountRewards({
  account,
  active,
  pending,
  claimed,
}: {
  account: Address;
  active: Distribution | undefined;
  pending: Distribution | undefined;
  claimed: Map<Address, bigint>;
}): AccountReward[] {
  const key = getAddress(account);
  return accountTokens(key, active, pending).map((token) => {
    const leaf = leafOf(active, key, token);
    const earned = BigInt(leaf?.claimable ?? 0);
    const paid = claimed.get(token) ?? 0n;
    const next = BigInt(leafOf(pending, key, token)?.claimable ?? 0);
    return {
      token,
      earned,
      proof: leaf?.proof ?? [],
      claimed: paid,
      claimable: earned > paid ? earned - paid : 0n,
      upcoming: next > earned ? next - earned : 0n,
    };
  });
}
