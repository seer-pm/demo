import type { PublicClient } from "viem";
import { assertForwardOnly, parseCampaigns } from "./campaigns.ts";
import { SOURCE_CHAINS } from "./chains.ts";
import { type Distribution, assertNoDecrease, buildDistributions } from "./distribution.ts";
import {
  type EngineStateJson,
  type PositionAccrual,
  accrueRewards,
  parseState,
  serializeState,
  weekStart,
} from "./engine.ts";
import { fetchChainEvents, findLastBlockBefore } from "./events.ts";

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
  /** Every campaign in `campaigns.json`; only those paying on `payoutChainId` are used. */
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
