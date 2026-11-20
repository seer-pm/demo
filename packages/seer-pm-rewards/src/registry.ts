import { type Address, type Hex, type PublicClient, type RpcLog, decodeEventLog, encodeEventTopics } from "viem";
import { emittedBetween, toIsoSeconds } from "./campaigns.ts";
import { rewardCampaignsAbi } from "./claims.ts";
import type { EngineStateJson } from "./engine.ts";
import { findLastBlockBefore, getLogs } from "./events.ts";

/** A campaign in the JSON form `parseCampaigns` validates and the published files embed. */
export type RawCampaign = {
  id: string;
  chainId: number;
  poolId: Hex;
  payoutChainId: number;
  rewardToken: string;
  rates: { from: string; perSecond: string }[];
  budget: string;
  minWidthTicks: number;
  /** Whether its budget was deposited. A hand-written campaigns file may leave it out, which counts as funded. */
  funded?: boolean;
};

/**
 * The campaigns of `payoutChainId`'s registry as of the last `CampaignSet` of each id in `logs`, which must be
 * in chain order. Rewards pay out on the pool's chain, so every campaign's pool is on `payoutChainId`.
 */
export function campaignsFromLogs(logs: RpcLog[], payoutChainId: number): RawCampaign[] {
  const byId = new Map<bigint, RawCampaign>();
  for (const log of logs) {
    const { args } = decodeEventLog({
      abi: rewardCampaignsAbi,
      eventName: "CampaignSet",
      topics: log.topics,
      data: log.data,
    });
    const c = args.campaign;
    byId.set(args.id, {
      id: args.id.toString(),
      chainId: payoutChainId,
      poolId: c.poolId.toLowerCase() as Hex,
      payoutChainId,
      rewardToken: c.rewardToken,
      rates: c.rates.map((rate) => ({ from: toIsoSeconds(Number(rate.from)), perSecond: rate.perSecond.toString() })),
      budget: c.budget.toString(),
      minWidthTicks: c.minWidthTicks,
      funded: c.funded,
    });
  }
  return [...byId.values()];
}

/**
 * Reads the events of the registry at `registry` on `payoutChainId` once, up to its last block before `upTo`, and
 * returns the campaigns as they were in the last block before any cutoff up to `upTo`. Rebuilding them from events
 * lets any past week be recomputed without an archive node, and reading the events once lets a catch-up over many
 * weeks cost one log scan. `client` must be connected to `payoutChainId`.
 */
export async function campaignHistory(
  client: PublicClient,
  registry: { address: Address; fromBlock: bigint },
  payoutChainId: number,
  upTo: number,
): Promise<(cutoff: number) => Promise<RawCampaign[]>> {
  const lastBlock = await findLastBlockBefore(client, upTo, registry.fromBlock);
  const [topic] = encodeEventTopics({ abi: rewardCampaignsAbi, eventName: "CampaignSet" });
  const logs = await getLogs(
    client,
    { address: registry.address, topics: [topic] },
    registry.fromBlock,
    lastBlock,
    1_000_000n,
  );
  const snapshots = new Map<number, Promise<RawCampaign[]>>();
  return (cutoff) => {
    if (cutoff > upTo) throw new Error(`cutoff ${toIsoSeconds(cutoff)} is after ${toIsoSeconds(upTo)}`);
    if (!snapshots.has(cutoff)) {
      snapshots.set(
        cutoff,
        (async () => {
          const toBlock = cutoff === upTo ? lastBlock : await findLastBlockBefore(client, cutoff, registry.fromBlock);
          return campaignsFromLogs(
            logs.filter((log) => BigInt(log.blockNumber!) <= toBlock),
            payoutChainId,
          );
        })(),
      );
    }
    return snapshots.get(cutoff)!;
  };
}

/** What each campaign emitted in total up to a file's cutoff, by campaign id: what the registry must release. */
export function emittedByCampaign(states: Record<string, EngineStateJson>): Map<string, bigint> {
  return new Map(
    Object.values(states).flatMap((state) => Object.entries(state.budgetUsed).map(([id, used]) => [id, BigInt(used)])),
  );
}

/**
 * The `[id, emitted]` pairs the registry's `release` must get up to `target`: the campaigns with something new to pay.
 * The others are left out, so the batch does not grow with campaigns that ended, spent their budget or no longer
 * earn. The cumulative amount must fit both the on-chain budget and the integral of the rates until the cutoff.
 * `stuck` identifies lower recomputations: the distributor cannot return amounts already transferred.
 */
export function dueReleases(
  campaigns: RawCampaign[],
  onchain: readonly { released: bigint; budget: bigint }[],
  emitted: Map<string, bigint>,
  target: number,
): { due: [string, bigint][]; stuck: string[] } {
  const due: [string, bigint][] = [];
  const stuck: string[] = [];
  const blocked: string[] = [];
  for (const c of campaigns) {
    // Its file has no release leaf until it is funded, so no release pays it.
    if (c.funded === false) continue;
    const { budget, released } = onchain[Number(c.id)];
    const total = emitted.get(c.id) ?? 0n;
    if (total < released) stuck.push(c.id);
    if (total <= released) continue;
    const rates = c.rates.map((rate) => ({ from: Date.parse(rate.from) / 1000, perSecond: BigInt(rate.perSecond) }));
    const cap = emittedBetween(rates, 0, target);
    if (total > budget) {
      blocked.push(
        `campaign ${c.id} emitted ${total}, ${total - budget} over the budget a refund left it, so no release pays it`,
      );
    } else if (total > cap) {
      blocked.push(`campaign ${c.id} emitted ${total}, ${total - cap} over the cumulative rate cap`);
    }
    due.push([c.id, total]);
  }
  if (blocked.length > 0) throw new Error(`not releasing: ${blocked.join("; ")}`);
  return { due, stuck };
}
