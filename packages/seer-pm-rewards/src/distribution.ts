import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { type Address, type Hex, getAddress, zeroHash } from "viem";
import { type Campaign, toIsoSeconds } from "./campaigns.ts";
import { type PositionAccrual, Q128 } from "./engine.ts";

/**
 * Contents of one published reward file: everything a payout chain's Morpho Universal Rewards
 * Distributor needs. `claimable` is cumulative since the first distribution, which is what the
 * distributor's leaf `(account, reward, claimable)` expects.
 */
export type Distribution = {
  payoutChainId: number;
  cutoff: string;
  /** Last block included per source chain. */
  sourceBlocks: Record<string, string>;
  /** `bytes32(0)` when nothing has been earned yet; the distributor rejects claims against it. */
  root: Hex;
  totals: Record<Address, string>;
  claims: Record<Address, Record<Address, { claimable: string; proof: Hex[] }>>;
  /** Per-position breakdown for the UI, floored per entry. */
  positions: { campaignId: string; chainId: number; tokenId: string; owner: Address; amount: string }[];
};

/** Leaf encoding of the Morpho Universal Rewards Distributor. */
export const LEAF_TYPES = ["address", "address", "uint256"];

const cmp = <T extends string | bigint>(a: T, b: T) => (a < b ? -1 : a > b ? 1 : 0);

/** One distribution per payout chain used by `campaigns`, in `campaigns` order. */
export function buildDistributions({
  campaigns,
  accruals,
  cutoff,
  sourceBlocks,
}: {
  campaigns: Campaign[];
  accruals: PositionAccrual[];
  cutoff: number;
  sourceBlocks: Record<number, bigint>;
}): Distribution[] {
  const campaignById = new Map(campaigns.map((c) => [c.id, c]));
  const payoutChainIds = [...new Set(campaigns.map((c) => c.payoutChainId))];

  return payoutChainIds.map((payoutChainId) => {
    const sorted = accruals
      .filter((a) => campaignById.get(a.campaignId)!.payoutChainId === payoutChainId)
      .sort((a, b) => cmp(a.campaignId, b.campaignId) || cmp(a.tokenId, b.tokenId) || cmp(a.owner, b.owner));

    // Accounts are summed across pools before flooring, so splitting a position never loses a unit.
    const byLeaf = new Map<string, { account: Address; token: Address; amountX128: bigint }>();
    for (const accrual of sorted) {
      const account = getAddress(accrual.owner);
      const token = campaignById.get(accrual.campaignId)!.rewardToken;
      const key = `${account}:${token}`;
      const leaf = byLeaf.get(key) ?? { account, token, amountX128: 0n };
      leaf.amountX128 += accrual.amountX128;
      byLeaf.set(key, leaf);
    }
    const leaves = [...byLeaf.values()]
      .map(({ account, token, amountX128 }) => [account, token, (amountX128 / Q128).toString()])
      .filter(([, , claimable]) => claimable !== "0")
      .sort((a, b) => cmp(a[0], b[0]) || cmp(a[1], b[1]));

    const tree = leaves.length > 0 ? StandardMerkleTree.of(leaves, LEAF_TYPES) : undefined;
    const claims: Distribution["claims"] = {};
    const totals: Distribution["totals"] = {};
    leaves.forEach(([account, token, claimable], i) => {
      claims[account as Address] ??= {};
      claims[account as Address][token as Address] = { claimable, proof: tree!.getProof(i) as Hex[] };
      totals[token as Address] = (BigInt(totals[token as Address] ?? 0) + BigInt(claimable)).toString();
    });

    const sourceChainIds = new Set(campaigns.filter((c) => c.payoutChainId === payoutChainId).map((c) => c.chainId));
    return {
      payoutChainId,
      cutoff: toIsoSeconds(cutoff),
      sourceBlocks: Object.fromEntries(
        [...sourceChainIds].sort((a, b) => a - b).map((id) => [String(id), sourceBlocks[id].toString()]),
      ),
      root: (tree?.root ?? zeroHash) as Hex,
      totals,
      claims,
      positions: sorted.map((a) => ({
        campaignId: a.campaignId,
        chainId: campaignById.get(a.campaignId)!.chainId,
        tokenId: a.tokenId.toString(),
        owner: getAddress(a.owner),
        amount: (a.amountX128 / Q128).toString(),
      })),
    };
  });
}

/**
 * Checks that publishing `next` after `previous` is safe: the distributor pays
 * `claimable - claimed`, so a cumulative amount that went down would block that account's claims.
 */
export function assertNoDecrease(previous: Distribution, next: Distribution): void {
  for (const [account, tokens] of Object.entries(previous.claims)) {
    for (const [token, { claimable }] of Object.entries(tokens)) {
      const now = next.claims[account as Address]?.[token as Address]?.claimable ?? "0";
      if (BigInt(now) < BigInt(claimable)) {
        throw new Error(`${account} ${token}: cumulative claimable dropped from ${claimable} to ${now}`);
      }
    }
  }
}
