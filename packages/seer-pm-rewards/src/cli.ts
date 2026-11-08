// Computes the weekly reward distributions: one JSON file per payout chain, ready for
// `submitRoot(root, ipfsHash)` on that chain's Universal Rewards Distributor.
//
//   yarn workspace @seer-pm/rewards compute [--cutoff 2026-11-09T00:00:00Z] [--previous <file>]...
//
// --cutoff    Defaults to the last Monday 00:00 UTC. Blocks before this instant are included.
// --previous  Previously published files. Each one is recomputed at its own cutoff with the current
//             campaigns and must reproduce the published root: that rejects any campaign change that
//             rewrites a published week. The new cumulative amounts may not be lower either.
// --campaigns Defaults to campaigns.json next to this package's package.json.
// --out       Output directory, default ./distributions.
//
// RPC endpoints come from PRIVATE_RPC_MAINNET / _OPTIMISM / _BASE, else viem's public endpoints.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { http, type PublicClient, createPublicClient } from "viem";
import { type Campaign, parseCampaigns } from "./campaigns.ts";
import { SOURCE_CHAINS } from "./chains.ts";
import { type Distribution, assertNoDecrease, buildDistributions } from "./distribution.ts";
import { type PositionAccrual, accrueRewards } from "./engine.ts";
import { type ChainEvent, fetchChainEvents, findLastBlockBefore } from "./events.ts";

const DAY = 86_400;

function lastMondayUtc(nowSeconds: number): number {
  const midnight = Math.floor(nowSeconds / DAY) * DAY;
  const weekday = new Date(midnight * 1000).getUTCDay(); // 0 = Sunday
  return midnight - ((weekday + 6) % 7) * DAY;
}

function parseCutoff(value: string): number {
  const ms = Date.parse(value);
  if (!/Z$/.test(value) || Number.isNaN(ms) || ms % 1000 !== 0) {
    throw new Error(`--cutoff must be a UTC instant such as 2026-11-09T00:00:00Z, got ${value}`);
  }
  return ms / 1000;
}

const { values } = parseArgs({
  options: {
    cutoff: { type: "string" },
    previous: { type: "string", multiple: true, default: [] },
    campaigns: { type: "string", default: new URL("../campaigns.json", import.meta.url).pathname },
    out: { type: "string", default: "distributions" },
  },
});

const cutoff = values.cutoff ? parseCutoff(values.cutoff) : lastMondayUtc(Math.floor(Date.now() / 1000));
const campaigns = parseCampaigns(JSON.parse(readFileSync(values.campaigns, "utf8")));
if (campaigns.length === 0) {
  console.log(`no campaigns in ${values.campaigns}`);
  process.exit(0);
}
const previous: Distribution[] = values.previous.map((file) => JSON.parse(readFileSync(file, "utf8")));
for (const p of previous) {
  if (parseCutoff(p.cutoff) > cutoff) throw new Error(`previous distribution ${p.cutoff} is after the cutoff`);
}

const campaignsByChain = new Map<number, Campaign[]>();
for (const campaign of campaigns) {
  campaignsByChain.set(campaign.chainId, [...(campaignsByChain.get(campaign.chainId) ?? []), campaign]);
}

const eventsByChain = new Map<number, ChainEvent[]>();
const sourceBlocks: Record<number, bigint> = {};
for (const [chainId, chainCampaigns] of campaignsByChain) {
  const source = SOURCE_CHAINS[chainId];
  const client = createPublicClient({
    chain: source.chain,
    transport: http(process.env[source.rpcEnv] || undefined),
  }) as PublicClient;
  const toBlock = await findLastBlockBefore(client, cutoff, source.fromBlock);
  const poolIds = [...new Set(chainCampaigns.map((c) => c.poolId))];
  const events = await fetchChainEvents(client, source, poolIds, toBlock);
  console.log(`chain ${chainId}: ${events.length} events in ${poolIds.length} pools through block ${toBlock}`);
  eventsByChain.set(chainId, events);
  sourceBlocks[chainId] = toBlock;
}

function distributionsAt(at: number): Distribution[] {
  const accruals: PositionAccrual[] = [];
  for (const [chainId, chainCampaigns] of campaignsByChain) {
    accruals.push(
      ...accrueRewards({
        positionManager: SOURCE_CHAINS[chainId].positionManager,
        campaigns: chainCampaigns,
        events: eventsByChain.get(chainId)!,
        cutoff: at,
      }),
    );
  }
  return buildDistributions({ campaigns, accruals, cutoff: at, sourceBlocks });
}

const distributions = distributionsAt(cutoff);

for (const published of previous) {
  const recomputed = distributionsAt(parseCutoff(published.cutoff)).find(
    (d) => d.payoutChainId === published.payoutChainId,
  );
  if (recomputed?.root !== published.root) {
    const at = `chain ${published.payoutChainId} at ${published.cutoff}`;
    const roots = `${published.root}, now ${recomputed?.root}`;
    const rule = "Campaign changes may only take effect at or after the last published cutoff.";
    throw new Error(`the current campaigns no longer reproduce the published root for ${at} (${roots}). ${rule}`);
  }
  assertNoDecrease(published, distributions.find((d) => d.payoutChainId === published.payoutChainId)!);
}

mkdirSync(values.out, { recursive: true });
for (const distribution of distributions) {
  const file = join(values.out, `rewards-${distribution.payoutChainId}-${distribution.cutoff.slice(0, 10)}.json`);
  writeFileSync(file, `${JSON.stringify(distribution, null, 2)}\n`);
  console.log(
    `chain ${distribution.payoutChainId}: root ${distribution.root}, totals`,
    distribution.totals,
    "->",
    file,
  );
}
