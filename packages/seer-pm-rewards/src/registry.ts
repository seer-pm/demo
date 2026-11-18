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
 * The `[id, emitted]` pairs the registry's `release` must get up to `target`: campaigns with something new to pay,
 * and ended campaigns whose cutoff is not past their end yet, which `settleRefund` needs before it returns the rest.
 * The others are left out, so the batch does not grow with campaigns that spent their budget or no longer earn, and
 * the hourly retries of a failed upload send nothing again.
 * A campaign left out keeps its cutoff, and `release` caps each total at what the rates emit since that cutoff, so a
 * campaign that stops earning (a dead pool after its market resolves) exposes more of its escrow to the releaser key
 * every week. End it with a rate of 0: its final release then goes through and its funder gets the rest back.
 *
 * Throws when a total is over that cap, which happens when a week is recomputed with a higher total after its
 * release: the whole batch would revert, so the error names each campaign and the owner's call that releases it.
 *
 * `stuck` lists the ended campaigns whose total came out below what was already released (a final week recomputed
 * lower). `release` sends them nothing and leaves their cutoff before the end, so `settleRefund` holds back what the
 * rates could emit after it for good. The releaser frees it by hand with `release([id], [released], cutoff)` at a
 * cutoff at or after the end, which moves the cutoff without sending anything.
 */
export function dueReleases(
  campaigns: RawCampaign[],
  releases: readonly { released: bigint; upTo: bigint }[],
  emitted: Map<string, bigint>,
  target: number,
): { due: [string, bigint][]; stuck: string[] } {
  const due: [string, bigint][] = [];
  const stuck: string[] = [];
  const overCap: string[] = [];
  for (const c of campaigns) {
    const r = releases[Number(c.id)];
    const total = emitted.get(c.id) ?? 0n;
    const rates = c.rates.map((rate) => ({ from: Date.parse(rate.from) / 1000, perSecond: BigInt(rate.perSecond) }));
    if (r.released < total) {
      const cap = r.released + emittedBetween(rates, Number(r.upTo), target);
      if (total > cap) {
        overCap.push(
          `campaign ${c.id} emitted ${total}, ${total - cap} over what the releaser may send since its last cutoff ` +
            `${r.upTo}; the registry owner must call release([${c.id}], [${total}], ${target})`,
        );
      }
      due.push([c.id, total]);
      continue;
    }
    const last = rates[rates.length - 1];
    if (last.perSecond === 0n && r.upTo < BigInt(last.from)) {
      due.push([c.id, total]);
      if (r.released > total) stuck.push(c.id);
    }
  }
  if (overCap.length > 0) throw new Error(`not releasing: ${overCap.join("; ")}`);
  return { due, stuck };
}
