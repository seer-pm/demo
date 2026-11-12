import type { PublicClient } from "viem";
import { assertForwardOnly, parseCampaigns } from "./campaigns.ts";
import { SOURCE_CHAINS } from "./chains.ts";
import { type Distribution, assertNoDecrease, buildDistributions } from "./distribution.ts";
import {
  type EngineStateJson,
  type PositionAccrual,
  WEEK,
  accrueRewards,
  parseState,
  serializeState,
  weekStart,
} from "./engine.ts";
import { fetchChainEvents, findLastBlockBefore } from "./events.ts";
import type { RawCampaign } from "./registry.ts";

/**
 * What gets published for one payout chain each week, and what its distributor's `ipfsHash`
 * points to: the distribution, the campaigns it was computed with, and the engine state of every
 * source chain, from which the next week resumes.
 */
export type RewardsFile = Distribution & {
  campaigns: unknown[];
  states: Record<string, EngineStateJson>;
};

/** Parses a cutoff, which must be a Monday 00:00 UTC such as `2026-11-09T00:00:00Z`. */
export function parseCutoff(value: string): number {
  const ms = Date.parse(value);
  const t = ms / 1000;
  if (!/Z$/.test(value) || Number.isNaN(ms) || weekStart(t) !== t) {
    throw new Error(`cutoffs must be a Monday 00:00 UTC such as 2026-11-09T00:00:00Z, got ${value}`);
  }
  return t;
}

/**
 * Computes the rewards file of `payoutChainId` at `cutoff`.
 *
 * With `previous`, the last published file of that chain, the replay resumes from its states and
 * reads only newer blocks, plus the history of pools and positions new to it. Before that, the
 * states must rebuild the published root, and campaign changes may only take effect from the
 * previous cutoff on. Without it, every source chain is replayed from the hook deployment.
 */
export async function computeWeek({
  payoutChainId,
  rawCampaigns,
  cutoff,
  previous,
  clientFor,
}: {
  payoutChainId: number;
  /** The campaigns at `cutoff`, such as `campaignHistory` gives; only those paying on `payoutChainId` are used. */
  rawCampaigns: { payoutChainId?: unknown; chainId?: unknown }[];
  cutoff: number;
  previous?: RewardsFile;
  clientFor: (chainId: number) => PublicClient;
}): Promise<RewardsFile> {
  const allCampaigns = parseCampaigns({ campaigns: rawCampaigns });
  const raw = rawCampaigns.filter((c) => c.payoutChainId === payoutChainId);
  const campaigns = allCampaigns.filter((c) => c.payoutChainId === payoutChainId);
  if (campaigns.length === 0) throw new Error(`no campaigns pay out on chain ${payoutChainId}`);

  if (previous) {
    if (previous.payoutChainId !== payoutChainId) {
      throw new Error(`previous file is for chain ${previous.payoutChainId}, not ${payoutChainId}`);
    }
    const previousCutoff = parseCutoff(previous.cutoff);
    if (previousCutoff >= cutoff) throw new Error(`previous cutoff ${previous.cutoff} is not before the cutoff`);
    // The states must be the ones behind the published root, or the new root would build on
    // something no one can check against the distributor.
    const publishedCampaigns = parseCampaigns({ campaigns: previous.campaigns });
    const [rebuilt] = buildDistributions({
      campaigns: publishedCampaigns,
      accruals: Object.values(previous.states).flatMap((s) => [...parseState(s).accrued.values()]),
      cutoff: previousCutoff,
      sourceBlocks: Object.fromEntries(Object.entries(previous.sourceBlocks).map(([id, b]) => [id, BigInt(b)])),
    });
    if (rebuilt?.root !== previous.root) {
      throw new Error(`previous file's states give root ${rebuilt?.root}, but it publishes ${previous.root}`);
    }
    assertForwardOnly(publishedCampaigns, campaigns, previousCutoff);
  }

  const accruals: PositionAccrual[] = [];
  const sourceBlocks: Record<number, bigint> = {};
  const states: Record<string, EngineStateJson> = {};
  for (const chainId of [...new Set(campaigns.map((c) => c.chainId))].sort((a, b) => a - b)) {
    const source = SOURCE_CHAINS[chainId];
    const client = clientFor(chainId);
    const resumedState = previous?.states[chainId];
    const state = resumedState ? parseState(resumedState) : undefined;
    const sinceBlock = resumedState ? BigInt(previous!.sourceBlocks[chainId]) + 1n : source.fromBlock;
    const toBlock = await findLastBlockBefore(client, cutoff, sinceBlock);
    const chainCampaigns = campaigns.filter((c) => c.chainId === chainId);
    const poolIds = [...new Set(chainCampaigns.map((c) => c.poolId))];
    const events = await fetchChainEvents(client, source, {
      trackedPoolIds: poolIds.filter((id) => state?.pools.has(id)),
      newPoolIds: poolIds.filter((id) => !state?.pools.has(id)),
      knownTokenIds: [...(state?.owners.keys() ?? [])],
      sinceBlock,
      toBlock,
    });
    console.log(
      `chain ${chainId}: ${events.length} events in ${poolIds.length} pools, blocks ${sinceBlock}-${toBlock}`,
    );

    const next = accrueRewards({
      positionManager: source.positionManager,
      campaigns: chainCampaigns,
      events,
      cutoff,
      state,
    });
    accruals.push(...next.accrued.values());
    sourceBlocks[chainId] = toBlock;
    states[chainId] = serializeState(next);
  }

  const [distribution] = buildDistributions({ campaigns, accruals, cutoff, sourceBlocks });
  if (previous) assertNoDecrease(previous, distribution);
  return { ...distribution, campaigns: raw, states };
}

/**
 * Computes the rewards file of `payoutChainId` at `cutoff` one week at a time, from `previous` or, without it,
 * from the first week a campaign ran, each week with `campaignsAt` of its own cutoff. A campaign's budget and
 * settings at a cutoff apply to the whole week that ends there, so replaying several weeks with the campaigns of
 * the last one would apply its settings to the earlier weeks too. Without `previous`, returns undefined when no
 * campaign has run on `payoutChainId` before `cutoff`.
 */
export async function computeWeeks({
  payoutChainId,
  campaignsAt,
  cutoff,
  previous,
  clientFor,
}: {
  payoutChainId: number;
  /** The campaigns at a cutoff, such as `campaignHistory` gives. */
  campaignsAt: (cutoff: number) => Promise<RawCampaign[]>;
  cutoff: number;
  previous?: RewardsFile;
  clientFor: (chainId: number) => PublicClient;
}): Promise<RewardsFile | undefined> {
  let first: number;
  if (previous) {
    first = parseCutoff(previous.cutoff) + WEEK;
    if (first > cutoff) throw new Error(`previous cutoff ${previous.cutoff} is not before the cutoff`);
  } else {
    // Campaigns are never removed, so the ones at `cutoff` include the first one that ran.
    const campaigns = parseCampaigns({ campaigns: await campaignsAt(cutoff) }).filter(
      (c) => c.payoutChainId === payoutChainId,
    );
    if (campaigns.length === 0) return undefined;
    first = weekStart(Math.min(...campaigns.map((c) => c.rates[0].from))) + WEEK;
  }

  let file = previous;
  for (let weekCutoff = first; weekCutoff <= cutoff; weekCutoff += WEEK) {
    const rawCampaigns = await campaignsAt(weekCutoff);
    file = await computeWeek({ payoutChainId, rawCampaigns, cutoff: weekCutoff, previous: file, clientFor });
  }
  return file;
}
