/**
 * Rewrites `markets.verification` from the Kleros curate subgraph, which is the source of truth the
 * rest of the app already trusts (`get-market` merges it live in `utils/markets.ts`).
 *
 * WHY THIS EXISTS: nothing in the scheduled path does a full reconcile. `scheduled-markets-import`
 * only rewrites the markets inside its `updatedAt` cursor window, and the incremental curate sync
 * only revisits items whose Kleros activity is newer than its own cursor. A row that drifts out of
 * both windows keeps whatever it last stored, with no path back. Run this whenever stored
 * verification and the registry are known to disagree.
 *
 * DOWNGRADES ARE NOT WRITTEN BY DEFAULT. A market the DB calls verified while the subgraph does not
 * is reported and skipped: on a first run that asymmetry is far more likely to be a subgraph gap
 * than a real de-registration. Pass `--apply-downgrades` once the printed list looks right.
 *
 * Usage (from the `web/` directory, so tsconfig `paths` resolve):
 *   npx tsx --env-file=.env.local scripts/resync-verification.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/resync-verification.ts
 *
 * Options:
 *   --dry-run            Print the diff and exit without writing anything.
 *   --chain <id>         Only this chain. Default: every chain with curation enabled.
 *   --apply-downgrades   Also write verified -> not_verified transitions.
 */
import { isVerificationEnabled } from "@/lib/config.ts";
import type { SupportedChain, VerificationResult } from "@seer-pm/sdk";
import { lightGeneralizedTcrAbi, lightGeneralizedTcrAddress } from "@seer-pm/sdk/contracts/curate";
import { createClient } from "@supabase/supabase-js";
import { sepolia } from "viem/chains";
import { readContract } from "viem/actions";
// Imported for its side effects (initApiHost + configurePublicRpcUrls) before anything talks to a
// subgraph proxy or an RPC, so keep it above the modules that do.
import { chainIds, getPublicClientByChainId } from "../netlify/functions/utils/config.ts";
import { getSubgraphVerificationStatusList } from "../netlify/functions/utils/curate.ts";
import type { Database } from "../netlify/functions/utils/supabase.ts";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

/** PostgREST caps a plain select at 1000 rows; a chain holds a few thousand markets. */
const SELECT_PAGE_SIZE = 1000;
/** Same chunking the scheduled import uses, for the same PostgREST request-size reason. */
const UPSERT_CHUNK_SIZE = 250;

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  return idx === -1 ? undefined : process.argv[idx + 1];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

/**
 * `getSubgraphVerificationStatusList` swallows an unreachable RPC and returns every result without a
 * `deadline`, which would quietly erase the deadline of every already-verified market. Read the
 * challenge period ourselves first and refuse to run if it fails.
 */
async function assertChallengePeriodReadable(chainId: SupportedChain): Promise<void> {
  try {
    await readContract(getPublicClientByChainId(chainId), {
      address: lightGeneralizedTcrAddress[chainId],
      abi: lightGeneralizedTcrAbi,
      functionName: "challengePeriodDuration",
    });
  } catch (e) {
    throw new Error(
      `Chain ${chainId}: cannot read challengePeriodDuration from the RPC, so every verification would be` +
        ` written without its deadline. Set PRIVATE_RPC_${chainId === 100 ? "GNOSIS" : "MAINNET"} to a working` +
        ` endpoint and re-run. Cause: ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`,
    );
  }
}

type StoredMarket = { id: string; verification: VerificationResult | null };

async function fetchStoredVerification(chainId: SupportedChain): Promise<StoredMarket[]> {
  const all: StoredMarket[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("markets")
      .select("id, verification")
      .eq("chain_id", chainId)
      .order("id", { ascending: true })
      .range(offset, offset + SELECT_PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Failed to read markets for chain ${chainId}: ${error.message}`);
    }

    all.push(...((data ?? []) as unknown as StoredMarket[]));
    if (!data || data.length < SELECT_PAGE_SIZE) {
      return all;
    }
    offset += SELECT_PAGE_SIZE;
  }
}

function isSameVerification(a: VerificationResult | null, b: VerificationResult): boolean {
  return a?.status === b.status && a?.itemID === b.itemID && a?.deadline === b.deadline;
}

type Change = { id: string; from: VerificationResult | null; to: VerificationResult };

function describe(verification: VerificationResult | null): string {
  if (!verification) return "<null>";
  const itemID = verification.itemID ? ` item=${verification.itemID.slice(0, 10)}` : "";
  const deadline = verification.deadline ? ` deadline=${verification.deadline}` : "";
  return `${verification.status}${itemID}${deadline}`;
}

async function applyChanges(chainId: SupportedChain, changes: Change[]): Promise<void> {
  for (let i = 0; i < changes.length; i += UPSERT_CHUNK_SIZE) {
    const rows = changes.slice(i, i + UPSERT_CHUNK_SIZE).map(({ id, to }) => ({
      id,
      chain_id: chainId,
      verification: to as unknown as Database["public"]["Tables"]["markets"]["Insert"]["verification"],
    }));

    const { error } = await supabase.from("markets").upsert(rows);
    if (error) {
      throw new Error(`Chain ${chainId}: verification upsert failed at offset ${i}: ${error.message}`);
    }
  }
}

async function processChain(chainId: SupportedChain, { dryRun, applyDowngrades }: Options): Promise<number> {
  await assertChallengePeriodReadable(chainId);
  const truth = await getSubgraphVerificationStatusList(chainId);
  const stored = await fetchStoredVerification(chainId);
  console.log(`\nChain ${chainId}: ${Object.keys(truth).length} curate items, ${stored.length} markets in the DB`);

  if (Object.keys(truth).length === 0) {
    console.error(`Chain ${chainId}: empty curate map, refusing to touch anything`);
    return 0;
  }

  const upgrades: Change[] = [];
  const changed: Change[] = [];
  const downgrades: Change[] = [];

  for (const market of stored) {
    // A market with no curate item was never submitted to Kleros; only flag it when the DB claims
    // otherwise, so the common case doesn't produce thousands of no-op rows.
    const to = truth[market.id as `0x${string}`] ?? { status: "not_verified" as const };
    const from = market.verification ?? null;
    if (isSameVerification(from, to)) {
      continue;
    }

    if (to.status === "not_verified") {
      if (from && from.status !== "not_verified") {
        downgrades.push({ id: market.id, from, to });
      }
      // `{status:"not_verified"}` vs `null` is not worth a write.
      continue;
    }

    (!from || from.status === "not_verified" ? upgrades : changed).push({ id: market.id, from, to });
  }

  for (const change of upgrades) {
    console.log(`  upgrade   ${change.id}  ${describe(change.from)} -> ${describe(change.to)}`);
  }
  for (const change of changed) {
    console.log(`  changed   ${change.id}  ${describe(change.from)} -> ${describe(change.to)}`);
  }
  for (const change of downgrades) {
    console.log(`  downgrade ${change.id}  ${describe(change.from)} -> ${describe(change.to)}`);
  }

  const toWrite = [...upgrades, ...changed, ...(applyDowngrades ? downgrades : [])];
  console.log(
    `Chain ${chainId}: ${upgrades.length} upgrade(s), ${changed.length} changed, ${downgrades.length} downgrade(s)` +
      `${applyDowngrades ? "" : " (downgrades reported only, pass --apply-downgrades to write them)"}`,
  );

  if (dryRun) {
    console.log(`Chain ${chainId}: dry run, nothing written`);
    return 0;
  }

  if (toWrite.length > 0) {
    await applyChanges(chainId, toWrite);
    console.log(`Chain ${chainId}: wrote ${toWrite.length} row(s)`);
  }

  return toWrite.length;
}

type Options = { dryRun: boolean; applyDowngrades: boolean };

async function main() {
  const options: Options = { dryRun: hasFlag("--dry-run"), applyDowngrades: hasFlag("--apply-downgrades") };
  const onlyChain = getArg("--chain");

  const targets = chainIds.filter(
    (chainId) =>
      chainId !== sepolia.id &&
      isVerificationEnabled(chainId) &&
      (onlyChain === undefined || chainId === Number(onlyChain)),
  );

  if (targets.length === 0) {
    throw new Error(`No chain with curation enabled matches ${onlyChain ?? "the default selection"}`);
  }

  let written = 0;
  for (const chainId of targets) {
    written += await processChain(chainId, options);
  }

  console.log(`\nDone. ${written} market row(s) written across ${targets.length} chain(s).`);
}

main().catch((e) => {
  console.error("Verification resync failed:", e);
  process.exit(1);
});
