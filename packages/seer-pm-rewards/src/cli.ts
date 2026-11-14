// Computes the rewards at a cutoff offline: one file per payout chain, the same file the bot publishes
// to IPFS and submits to that chain's Universal Rewards Distributor. Every week since --previous is
// computed in turn, each with the campaigns at its own cutoff.
//
//   yarn workspace @seer-pm/rewards compute [--cutoff 2026-11-09T00:00:00Z] [--previous distributions/2026-11-02]
//
// --cutoff    A Monday 00:00 UTC, by default the last one. Blocks before this instant are included.
// --previous  Directory of the last published week. Each payout chain resumes from its
//             rewards-<chain>.json there; chains without one start from their first campaign's week.
// --campaigns A { "campaigns": [...] } JSON file to use instead of each payout chain's registry.
// --out       Files go to <out>/<cutoff date>/, default ./distributions.
//
// RPC endpoints come from PRIVATE_RPC_MAINNET / _OPTIMISM / _BASE, else viem's public endpoints.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { http, type PublicClient, createPublicClient } from "viem";
import { toIsoSeconds } from "./campaigns.ts";
import { PAYOUT_CHAINS, SOURCE_CHAINS } from "./chains.ts";
import { weekStart } from "./engine.ts";
import { type RawCampaign, campaignHistory } from "./registry.ts";
import { type RewardsFile, computeWeeks, parseCutoff } from "./week.ts";

const { values } = parseArgs({
  options: {
    cutoff: { type: "string" },
    previous: { type: "string" },
    campaigns: { type: "string" },
    out: { type: "string", default: "distributions" },
  },
});

const cutoff = values.cutoff ? parseCutoff(values.cutoff) : weekStart(Math.floor(Date.now() / 1000));
const fileCampaigns: RawCampaign[] | undefined = values.campaigns
  ? (JSON.parse(readFileSync(values.campaigns, "utf8")).campaigns ?? [])
  : undefined;
const payoutChainIds = fileCampaigns
  ? ([...new Set(fileCampaigns.map((c) => c.payoutChainId))] as number[])
  : Object.keys(PAYOUT_CHAINS)
      .map(Number)
      .filter((id) => PAYOUT_CHAINS[id].registry);

const clients = new Map<number, PublicClient>();
const clientFor = (chainId: number) => {
  if (!clients.has(chainId)) {
    const { chain, rpcEnv } = SOURCE_CHAINS[chainId] ?? PAYOUT_CHAINS[chainId];
    clients.set(
      chainId,
      createPublicClient({ chain, transport: http(process.env[rpcEnv] || undefined) }) as PublicClient,
    );
  }
  return clients.get(chainId)!;
};

const dir = join(values.out, toIsoSeconds(cutoff).slice(0, 10));
for (const payoutChainId of payoutChainIds) {
  const previousPath = values.previous && join(values.previous, `rewards-${payoutChainId}.json`);
  const previous: RewardsFile | undefined =
    previousPath && existsSync(previousPath) ? JSON.parse(readFileSync(previousPath, "utf8")) : undefined;
  const registry = PAYOUT_CHAINS[payoutChainId]?.registry;
  const campaignsAt = fileCampaigns
    ? async () => fileCampaigns
    : registry
      ? await campaignHistory(clientFor(payoutChainId), registry, payoutChainId, cutoff)
      : async () => [];
  const file = await computeWeeks({ payoutChainId, campaignsAt, cutoff, previous, clientFor });
  if (!file) {
    console.log(`chain ${payoutChainId}: no campaigns at ${toIsoSeconds(cutoff)}`);
    continue;
  }

  mkdirSync(dir, { recursive: true });
  const path = join(dir, `rewards-${payoutChainId}.json`);
  writeFileSync(path, `${JSON.stringify(file)}\n`);
  console.log(`chain ${payoutChainId}: root ${file.root}, totals`, file.totals, "->", path);
}
