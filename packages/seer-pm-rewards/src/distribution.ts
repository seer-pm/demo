import { SimpleMerkleTree } from "@openzeppelin/merkle-tree";
import { type Address, type Hex, encodeAbiParameters, getAddress, keccak256, parseAbiParameters, zeroHash } from "viem";
import { PAYOUT_CHAINS } from "./chains.ts";
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
  /** Zero only when there are neither claims nor campaign release or settlement leaves. */
  root: Hex;
  totals: Record<Address, string>;
  claims: Record<Address, Record<Address, { claimable: string; proof: Hex[] }>>;
  /**
   * What each campaign that emitted anything emitted up to `cutoff`, with its proof: the registry's `release` pays
   * the distributor these totals only once the distributor accepted this root.
   */
  releases: Record<string, { emitted: string; proof: Hex[] }>;
  settlements: Record<string, { emitted: string; proof: Hex[] }>;
  /** Per-position breakdown for the UI, floored per entry. */
  positions: { campaignId: string; chainId: number; tokenId: string; owner: Address; amount: string }[];
};

/** Leaf encoding of the Morpho Universal Rewards Distributor. */
const claimTypes = parseAbiParameters("address, address, uint256");
const settlementTypes = parseAbiParameters("uint256, address, uint256, uint64, uint256");
/** `RewardCampaigns.release` leaf: tagged, so it never reads as a settlement leaf of the same words. */
const releaseTypes = parseAbiParameters("string, uint256, address, uint256, uint64, uint256");

const cmp = <T extends string | bigint>(a: T, b: T) => (a < b ? -1 : a > b ? 1 : 0);

/** One distribution per payout chain used by `campaigns`, in `campaigns` order. */
export function buildDistributions({
  campaigns,
  accruals,
  cutoff,
  sourceBlocks,
  emitted,
}: {
  campaigns: Campaign[];
  accruals: PositionAccrual[];
  cutoff: number;
  sourceBlocks: Record<number, bigint>;
  emitted: ReadonlyMap<string, bigint>;
}): Distribution[] {
  const campaignById = new Map(campaigns.map((c) => [c.id, c]));
  const payoutChainIds = [...new Set(campaigns.map((c) => c.payoutChainId))];

  return payoutChainIds.map((payoutChainId) => {
    // A campaign waiting for its deposit keeps accruing, and the first root after it is funded pays all of it.
    const sorted = accruals
      .filter((a) => {
        const c = campaignById.get(a.campaignId)!;
        return c.payoutChainId === payoutChainId && c.funded;
      })
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

    const hashes = leaves.map(([account, token, amount]) =>
      keccak256(keccak256(encodeAbiParameters(claimTypes, [account as Address, token as Address, BigInt(amount)]))),
    );
    const registry = PAYOUT_CHAINS[payoutChainId]?.registry;
    // Every campaign that emitted gets a leaf, not only those the registry has yet to pay, so the file alone
    // rebuilds its root.
    const releases: Distribution["releases"] = {};
    const paying = campaigns.filter(
      (c) => c.payoutChainId === payoutChainId && c.funded && (emitted.get(c.id) ?? 0n) > 0n,
    );
    for (const c of paying) {
      if (!registry) throw new Error(`Missing registry for campaign ${c.id}`);
      const total = emitted.get(c.id)!;
      hashes.push(
        keccak256(
          keccak256(
            encodeAbiParameters(releaseTypes, [
              "release",
              BigInt(payoutChainId),
              registry.address,
              BigInt(c.id),
              BigInt(cutoff),
              total,
            ]),
          ),
        ),
      );
      releases[c.id] = { emitted: total.toString(), proof: [] };
    }
    const settlements: Distribution["settlements"] = {};
    const closed = campaigns.filter((c) => {
      const end = c.rates[c.rates.length - 1];
      return c.payoutChainId === payoutChainId && c.funded && end.perSecond === 0n && end.from <= cutoff;
    });
    for (const c of closed) {
      const total = emitted.get(c.id);
      if (!registry || total === undefined) throw new Error(`Missing registry or final emission for campaign ${c.id}`);
      hashes.push(
        keccak256(
          keccak256(
            encodeAbiParameters(settlementTypes, [
              BigInt(payoutChainId),
              registry.address,
              BigInt(c.id),
              BigInt(c.rates[c.rates.length - 1].from),
              total,
            ]),
          ),
        ),
      );
      settlements[c.id] = { emitted: total.toString(), proof: [] };
    }
    const tree = hashes.length ? SimpleMerkleTree.of(hashes) : undefined;
    paying.forEach((c, i) => {
      releases[c.id].proof = tree!.getProof(leaves.length + i) as Hex[];
    });
    closed.forEach((c, i) => {
      settlements[c.id].proof = tree!.getProof(leaves.length + paying.length + i) as Hex[];
    });
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
      releases,
      settlements,
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
 * What each account earned in the campaigns still waiting for their deposit, per reward token, summed across
 * positions before flooring like a claim. `buildDistributions` leaves these accruals out of the root until the
 * campaign is funded.
 */
export function unfundedEarnings(
  campaigns: Campaign[],
  accruals: PositionAccrual[],
): Record<Address, Record<Address, string>> {
  const tokenOf = new Map(campaigns.filter((c) => !c.funded).map((c) => [c.id, c.rewardToken]));
  const sums = new Map<string, { account: Address; token: Address; amountX128: bigint }>();
  for (const { campaignId, owner, amountX128 } of accruals) {
    const token = tokenOf.get(campaignId);
    if (!token) continue;
    const account = getAddress(owner);
    const sum = sums.get(`${account}:${token}`) ?? { account, token, amountX128: 0n };
    sum.amountX128 += amountX128;
    sums.set(`${account}:${token}`, sum);
  }
  const earned: Record<Address, Record<Address, string>> = {};
  for (const { account, token, amountX128 } of sums.values()) {
    if (amountX128 < Q128) continue;
    earned[account] ??= {};
    earned[account][token] = (amountX128 / Q128).toString();
  }
  return earned;
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
