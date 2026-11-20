// Browser-safe part of the package: what a claim UI needs to read a distributor and its published
// file and to call `claim`. It must not import the engine, the event fetcher or the merkle tree.
import { base58 } from "@scure/base";
import { type Address, type Hex, concat, getAddress, hexToBytes, parseAbi, toHex } from "viem";
import type { Distribution } from "./distribution.ts";

export { PAYOUT_CHAINS, SER_LPP, SOURCE_CHAINS, type PayoutChain } from "./chains.ts";
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

/** A payout chain's `RewardCampaigns` registry, read and released by the bot and written by the admin page. */
export const rewardCampaignsAbi = parseAbi([
  "struct Rate { uint64 from; uint256 perSecond; }",
  "struct Campaign { bytes32 poolId; address rewardToken; uint256 budget; uint32 minWidthTicks; address funder; uint256 released; Rate[] rates; }",
  "function owner() view returns (address)",
  "function isManager(address account) view returns (bool)",
  "function campaignCount() view returns (uint256)",
  "function getCampaigns(uint256 from, uint256 to) view returns (Campaign[])",
  "function createCampaign(bytes32 poolId, address rewardToken, uint256 perSecond, uint256 budget, uint32 minWidthTicks) returns (uint256 id)",
  "function setRate(uint256 id, uint256 perSecond)",
  "function release(uint256[] ids, uint256[] emitted, uint64 upTo, bytes32[][] proofs)",
  "function settleRefund(uint256 id, uint256 emitted, bytes32[] proof)",
  "event CampaignSet(uint256 indexed id, Campaign campaign)",
]);

/**
 * Campaigns per `getCampaigns(from, to)` call. Each costs some 25k gas to return with a short rate history, so a page
 * stays far below the gas cap RPC providers put on `eth_call`.
 */
export const CAMPAIGN_PAGE = 100n;

/**
 * Every campaign of a registry, read in pages of `CAMPAIGN_PAGE`. Pin `count` and `page` to one block, or a release
 * or refund mined between two pages mixes two states in the result.
 */
export async function readAllCampaigns<T>(
  count: () => Promise<bigint>,
  page: (from: bigint, to: bigint) => Promise<readonly T[]>,
): Promise<T[]> {
  const total = await count();
  const pages: Promise<readonly T[]>[] = [];
  for (let from = 0n; from < total; from += CAMPAIGN_PAGE) pages.push(page(from, from + CAMPAIGN_PAGE));
  return (await Promise.all(pages)).flat();
}

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

/**
 * Cumulative amounts per account and reward token up to `asOf`, computed like a weekly root but
 * for the latest block. Nothing in it can be claimed until a root includes it.
 */
export type RewardsEstimate = {
  payoutChainId: number;
  asOf: string;
  claims: Record<Address, Record<Address, string>>;
  /** What each campaign has emitted in total up to `asOf`, by campaign id (registry index). */
  emitted: Record<string, string>;
};

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
  /** Earned after the newest root (pending, else active), by the estimate; no root includes it yet. */
  accruing: bigint;
};

const leafOf = (file: Distribution | undefined, account: Address, token: Address) => file?.claims[account]?.[token];

/** Tokens `account` has an amount for in any of `sources` (distributions or an estimate). */
export function accountTokens(
  account: Address,
  ...sources: ({ claims: Record<Address, Record<Address, unknown>> } | undefined)[]
): Address[] {
  const key = getAddress(account);
  return [...new Set(sources.flatMap((source) => Object.keys(source?.claims[key] ?? {})))] as Address[];
}

/**
 * Rewards of `account` given the active distribution, the pending one if any, what the
 * distributor says it already claimed per token, and the estimate up to the latest block if any.
 */
export function accountRewards({
  account,
  active,
  pending,
  claimed,
  estimate,
}: {
  account: Address;
  active: Distribution | undefined;
  pending: Distribution | undefined;
  claimed: Map<Address, bigint>;
  estimate?: RewardsEstimate;
}): AccountReward[] {
  const key = getAddress(account);
  return accountTokens(key, active, pending, estimate).map((token) => {
    const leaf = leafOf(active, key, token);
    const earned = BigInt(leaf?.claimable ?? 0);
    const paid = claimed.get(token) ?? 0n;
    const next = BigInt(leafOf(pending, key, token)?.claimable ?? 0);
    // Cumulative amounts only grow, so the newest root's amount is the larger of the two.
    const published = next > earned ? next : earned;
    const estimated = BigInt(estimate?.claims[key]?.[token] ?? 0);
    return {
      token,
      earned,
      proof: leaf?.proof ?? [],
      claimed: paid,
      claimable: earned > paid ? earned - paid : 0n,
      upcoming: next > earned ? next - earned : 0n,
      accruing: estimated > published ? estimated - published : 0n,
    };
  });
}
