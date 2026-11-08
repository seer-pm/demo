// Computes one week of reward distributions: one JSON file per payout chain, ready for
// `submitRoot(root, ipfsHash)` on that chain's Universal Rewards Distributor, plus one state file
// per source chain from which the next week resumes.
//
//   yarn workspace @seer-pm/rewards compute [--cutoff 2026-11-09T00:00:00Z] [--previous distributions/2026-11-02]
//
// --cutoff    A Monday 00:00 UTC, by default the last one. Blocks before this instant are included.
// --previous  Directory of the last published week: its rewards-*.json as published and its
//             state-*.json. The replay resumes from those states and reads only newer blocks, plus
//             the history of pools and positions that are new to it. The states must reproduce the
//             published roots, and campaign changes may only take effect from that cutoff on.
//             Without it every chain is replayed from the hook deployment, which gives exactly the
//             same result as long as budget, minWidthTicks and excludeTokenIds never changed.
// --campaigns Defaults to campaigns.json next to this package's package.json.
// --out       Files go to <out>/<cutoff date>/, default ./distributions.
//
// RPC endpoints come from PRIVATE_RPC_MAINNET / _OPTIMISM / _BASE, else viem's public endpoints.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { http, type PublicClient, createPublicClient } from "viem";
import { type Campaign, assertForwardOnly, parseCampaigns, toIsoSeconds } from "./campaigns.ts";
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

type StateFile = { chainId: number; cutoff: string; toBlock: string; campaigns: unknown[]; engine: EngineStateJson };

function parseCutoff(value: string): number {
  const ms = Date.parse(value);
  const t = ms / 1000;
  if (!/Z$/.test(value) || Number.isNaN(ms) || weekStart(t) !== t) {
    throw new Error(`cutoffs must be a Monday 00:00 UTC such as 2026-11-09T00:00:00Z, got ${value}`);
  }
  return t;
}

const { values } = parseArgs({
  options: {
    cutoff: { type: "string" },
    previous: { type: "string" },
    campaigns: { type: "string", default: new URL("../campaigns.json", import.meta.url).pathname },
    out: { type: "string", default: "distributions" },
  },
});

const cutoff = values.cutoff ? parseCutoff(values.cutoff) : weekStart(Math.floor(Date.now() / 1000));
const rawCampaigns: { chainId?: unknown }[] = JSON.parse(readFileSync(values.campaigns, "utf8")).campaigns ?? [];
const campaigns = parseCampaigns({ campaigns: rawCampaigns });
if (campaigns.length === 0) {
  console.log(`no campaigns in ${values.campaigns}`);
  process.exit(0);
}

let previous: { states: Map<number, StateFile>; published: Distribution[] } | undefined;
if (values.previous) {
  const dir = values.previous;
  const files = readdirSync(dir);
  const read = (file: string) => JSON.parse(readFileSync(join(dir, file), "utf8"));
  const states: StateFile[] = files.filter((f) => /^state-\d+\.json$/.test(f)).map(read);
  const published: Distribution[] = files.filter((f) => /^rewards-\d+\.json$/.test(f)).map(read);
  if (states.length === 0) throw new Error(`no state-*.json in ${dir}`);
  const previousCutoff = parseCutoff(states[0].cutoff);
  for (const file of [...states, ...published]) {
    if (file.cutoff !== states[0].cutoff)
      throw new Error(`${dir} mixes cutoffs ${states[0].cutoff} and ${file.cutoff}`);
  }
  if (previousCutoff >= cutoff) throw new Error(`--previous ${states[0].cutoff} is not before the cutoff`);

  // The states must be the ones behind the published roots, or the new roots would build on
  // something no one can check against the distributor.
  const publishedCampaigns = parseCampaigns({ campaigns: states.flatMap((s) => s.campaigns) });
  const rebuilt = buildDistributions({
    campaigns: publishedCampaigns,
    accruals: states.flatMap((s) => [...parseState(s.engine).accrued.values()]),
    cutoff: previousCutoff,
    sourceBlocks: Object.fromEntries(states.map((s) => [s.chainId, BigInt(s.toBlock)])),
  });
  if (rebuilt.length !== published.length) throw new Error(`${dir}: state and rewards files cover different chains`);
  for (const d of rebuilt) {
    const root = published.find((p) => p.payoutChainId === d.payoutChainId)?.root;
    if (root !== d.root) {
      throw new Error(`${dir}: the states give root ${d.root} for chain ${d.payoutChainId}, published ${root}`);
    }
  }
  assertForwardOnly(publishedCampaigns, campaigns, previousCutoff);
  previous = { states: new Map(states.map((s) => [s.chainId, s])), published };
}

const campaignsByChain = new Map<number, Campaign[]>();
for (const campaign of campaigns) {
  campaignsByChain.set(campaign.chainId, [...(campaignsByChain.get(campaign.chainId) ?? []), campaign]);
}

const accruals: PositionAccrual[] = [];
const sourceBlocks: Record<number, bigint> = {};
const stateFiles: StateFile[] = [];
for (const [chainId, chainCampaigns] of campaignsByChain) {
  const source = SOURCE_CHAINS[chainId];
  const client = createPublicClient({
    chain: source.chain,
    transport: http(process.env[source.rpcEnv] || undefined),
  }) as PublicClient;

  const resumed = previous?.states.get(chainId);
  const state = resumed ? parseState(resumed.engine) : undefined;
  const sinceBlock = resumed ? BigInt(resumed.toBlock) + 1n : source.fromBlock;
  const toBlock = await findLastBlockBefore(client, cutoff, sinceBlock);
  const poolIds = [...new Set(chainCampaigns.map((c) => c.poolId))];
  const events = await fetchChainEvents(client, source, {
    trackedPoolIds: poolIds.filter((id) => state?.pools.has(id)),
    newPoolIds: poolIds.filter((id) => !state?.pools.has(id)),
    knownTokenIds: [...(state?.owners.keys() ?? [])],
    sinceBlock,
    toBlock,
  });
  console.log(`chain ${chainId}: ${events.length} events in ${poolIds.length} pools, blocks ${sinceBlock}-${toBlock}`);

  const next = accrueRewards({
    positionManager: source.positionManager,
    campaigns: chainCampaigns,
    events,
    cutoff,
    state,
  });
  accruals.push(...next.accrued.values());
  sourceBlocks[chainId] = toBlock;
  stateFiles.push({
    chainId,
    cutoff: toIsoSeconds(cutoff),
    toBlock: toBlock.toString(),
    campaigns: rawCampaigns.filter((c) => c.chainId === chainId),
    engine: serializeState(next),
  });
}

const distributions = buildDistributions({ campaigns, accruals, cutoff, sourceBlocks });
for (const published of previous?.published ?? []) {
  assertNoDecrease(published, distributions.find((d) => d.payoutChainId === published.payoutChainId)!);
}

const dir = join(values.out, toIsoSeconds(cutoff).slice(0, 10));
mkdirSync(dir, { recursive: true });
for (const file of stateFiles) writeFileSync(join(dir, `state-${file.chainId}.json`), `${JSON.stringify(file)}\n`);
for (const distribution of distributions) {
  const file = join(dir, `rewards-${distribution.payoutChainId}.json`);
  writeFileSync(file, `${JSON.stringify(distribution, null, 2)}\n`);
  console.log(
    `chain ${distribution.payoutChainId}: root ${distribution.root}, totals`,
    distribution.totals,
    "->",
    file,
  );
}
