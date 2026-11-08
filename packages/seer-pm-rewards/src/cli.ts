// Computes one week of rewards offline: one file per payout chain, the same file the bot publishes
// to IPFS and submits to that chain's Universal Rewards Distributor.
//
//   yarn workspace @seer-pm/rewards compute [--cutoff 2026-11-09T00:00:00Z] [--previous distributions/2026-11-02]
//
// --cutoff    A Monday 00:00 UTC, by default the last one. Blocks before this instant are included.
// --previous  Directory of the last published week. Each payout chain resumes from its
//             rewards-<chain>.json there; chains without one are replayed from the hook deployment.
// --campaigns Defaults to campaigns.json next to this package's package.json.
// --out       Files go to <out>/<cutoff date>/, default ./distributions.
//
// RPC endpoints come from PRIVATE_RPC_MAINNET / _OPTIMISM / _BASE, else viem's public endpoints.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { http, type PublicClient, createPublicClient } from "viem";
import { toIsoSeconds } from "./campaigns.ts";
import { SOURCE_CHAINS } from "./chains.ts";
import { weekStart } from "./engine.ts";
import { type RewardsFile, computeWeek, parseCutoff } from "./week.ts";

const { values } = parseArgs({
  options: {
    cutoff: { type: "string" },
    previous: { type: "string" },
    campaigns: { type: "string", default: new URL("../campaigns.json", import.meta.url).pathname },
    out: { type: "string", default: "distributions" },
  },
});

const cutoff = values.cutoff ? parseCutoff(values.cutoff) : weekStart(Math.floor(Date.now() / 1000));
const rawCampaigns: { payoutChainId?: unknown }[] = JSON.parse(readFileSync(values.campaigns, "utf8")).campaigns ?? [];
const payoutChainIds = [...new Set(rawCampaigns.map((c) => c.payoutChainId))] as number[];
if (payoutChainIds.length === 0) {
  console.log(`no campaigns in ${values.campaigns}`);
  process.exit(0);
}

const clients = new Map<number, PublicClient>();
const clientFor = (chainId: number) => {
  if (!clients.has(chainId)) {
    const { chain, rpcEnv } = SOURCE_CHAINS[chainId];
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
  const file = await computeWeek({ payoutChainId, rawCampaigns, cutoff, previous, clientFor });

  mkdirSync(dir, { recursive: true });
  const path = join(dir, `rewards-${payoutChainId}.json`);
  writeFileSync(path, `${JSON.stringify(file)}\n`);
  console.log(`chain ${payoutChainId}: root ${file.root}, totals`, file.totals, "->", path);
}
