import { SUPPORTED_CHAINS } from "@/lib/chains.ts";
import type { Market, SupportedChain } from "@seer-pm/sdk";
import { getCollateralByIndex, getToken0Token1, getTokensPairKey } from "@seer-pm/sdk";
import { createClient } from "@supabase/supabase-js";
import {
  type DexPoolHourFetchCursor,
  type FetchPoolHourDatasResult,
  dexPoolPairsFingerprint,
  fetchEarliestPoolHourPeriodStartUnix,
  fetchPoolHourDatasSince,
  parseDexPoolHourFetchCursor,
} from "./utils/fetchDexPoolHourDatas.ts";
import { MARKET_DB_FIELDS, type SubgraphMarket, mapGraphMarketFromDbResult } from "./utils/markets.ts";
import type { Database } from "./utils/supabase.ts";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

const INSERT_CHUNK = 300;

/**
 * Max width of one **outer** time slice `[sliceGt, sliceLte]` toward `goalLte` in a single scheduled run step.
 * Each slice is passed to `fetchPoolHourDatasSince`, which may further split it into inner windows. Smaller
 * outer slices cap how much history one invocation tries to pull before checkpointing / the next cron tick.
 */
const DEX_POOL_OUTER_SLICE_SEC = 30 * 24 * 60 * 60;
/** Avoid one scheduled run doing unbounded slice loops (Netlify time limits). */
const MAX_SLICES_PER_SCHEDULED_RUN = 1;

/**
 * Per-chain checkpoint holding both:
 *  - `completed_through`: the highest `periodStartUnix` whose full outer slice was fetched **and**
 *    upserted end-to-end. Used as `sliceGt` for the next fresh slice. Advanced only after every
 *    chunk upsert of a slice completes, so a crash mid-upsert cannot cause the next run to skip
 *    missing hours (unlike `max(period_start_unix)` from `dex_pool_hour_prices`, which can reflect
 *    partial chunk progress).
 *  - `fetch_cursor`: mid-fetch resume state (inner window + pair-batch pagination) for when a slice
 *    was paused by `MAX_PAGES_PER_RUN`. Null when no fetch is in flight.
 *
 * Both fields live in a single `key_value` row so every state transition is one atomic `upsert`.
 */
const DEX_POOL_CHECKPOINT_KEY = (chainId: number) => `dex_pool_hour_checkpoint_v1:${chainId}`;

type DexPoolHourCheckpoint = {
  completed_through: number;
  fetch_cursor: DexPoolHourFetchCursor | null;
};

function parseCheckpoint(value: unknown): DexPoolHourCheckpoint | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const o = value as Record<string, unknown>;
  if (typeof o.completed_through !== "number" || !Number.isFinite(o.completed_through) || o.completed_through < 0) {
    return null;
  }
  const rawCursor = o.fetch_cursor;
  const fetch_cursor = rawCursor == null ? null : parseDexPoolHourFetchCursor(rawCursor);
  return { completed_through: o.completed_through, fetch_cursor };
}

async function readCheckpoint(chainId: number): Promise<DexPoolHourCheckpoint | null> {
  const { data, error } = await supabase
    .from("key_value")
    .select("value")
    .eq("key", DEX_POOL_CHECKPOINT_KEY(chainId))
    .maybeSingle();
  if (error) {
    throw error;
  }

  return parseCheckpoint(data?.value ?? null);
}

async function writeCheckpoint(chainId: number, checkpoint: DexPoolHourCheckpoint): Promise<void> {
  const { error } = await supabase.from("key_value").upsert(
    {
      key: DEX_POOL_CHECKPOINT_KEY(chainId),
      value: checkpoint as unknown as Database["public"]["Tables"]["key_value"]["Insert"]["value"],
    },
    { onConflict: "key" },
  );

  if (error) {
    throw error;
  }
}

function logScheduled(runStart: number, message: string, chainMeta?: { chainId: number; chainStart: number }) {
  const runMs = Date.now() - runStart;
  const suffix =
    chainMeta !== undefined ? ` chain=${chainMeta.chainId} chain+${Date.now() - chainMeta.chainStart}ms` : "";
  console.log(`scheduled-dex-pool-prices +${runMs}ms${suffix} ${message}`);
}

/** One entry per outcome–collateral pool (canonical token0/token1), deduplicated. */
function collectUniqueDexPoolPairs(markets: Market[]): { token0: string; token1: string }[] {
  const seen = new Set<string>();
  const out: { token0: string; token1: string }[] = [];
  for (const market of markets) {
    for (let i = 0; i < market.wrappedTokens.length; i++) {
      const tokenId = market.wrappedTokens[i];
      const collateral = getCollateralByIndex(market, i);
      const { token0, token1 } = getToken0Token1(tokenId, collateral);
      const key = getTokensPairKey(token0, token1);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ token0: token0.toLowerCase(), token1: token1.toLowerCase() });
    }
  }
  return out;
}

async function loadMarketsForChain(
  chainId: number,
  runStart: number,
  chainMeta: { chainId: number; chainStart: number },
): Promise<Market[]> {
  const pageSize = 1000;
  let from = 0;
  const out: Market[] = [];
  while (true) {
    const pageT0 = Date.now();
    const { data, error } = await supabase
      .from("markets")
      .select(MARKET_DB_FIELDS)
      .eq("chain_id", chainId)
      .not("subgraph_data", "is", null)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      throw error;
    }
    if (!data?.length) {
      break;
    }
    for (const row of data) {
      try {
        out.push(mapGraphMarketFromDbResult(row.subgraph_data as SubgraphMarket, row));
      } catch {
        /* skip malformed */
      }
    }
    logScheduled(
      runStart,
      `loadMarkets page from=${from} batchLen=${data.length} cumulative=${out.length} page+${Date.now() - pageT0}ms`,
      chainMeta,
    );
    if (data.length < pageSize) {
      break;
    }
    from += pageSize;
  }
  return out;
}

export default async () => {
  if (process.env.DISABLE_SCHEDULED_FUNCTIONS === "true") {
    console.log("scheduled-dex-pool-prices: disabled");
    return;
  }

  const runStart = Date.now();
  const nowSec = Math.floor(Date.now() / 1000);
  /** Cap at the previous hour start so we only persist fully completed subgraph hour buckets (not the in-progress hour). */
  const periodLte = Math.max(0, (Math.floor(nowSec / 3600) - 1) * 3600);
  logScheduled(runStart, `start periodLte=${periodLte} nowSec=${nowSec}`);

  for (const chainIdStr in SUPPORTED_CHAINS) {
    const chainId = Number(chainIdStr);
    const chainStart = Date.now();
    const chainMeta = { chainId, chainStart };
    try {
      logScheduled(runStart, "chain begin", chainMeta);
      const markets = await loadMarketsForChain(chainId, runStart, chainMeta);
      const pairs = collectUniqueDexPoolPairs(markets);
      const currentPairsFingerprint = dexPoolPairsFingerprint(pairs);
      logScheduled(runStart, `loadMarkets done markets=${markets.length} uniquePools=${pairs.length}`, chainMeta);

      if (pairs.length === 0) {
        logScheduled(runStart, "skip (no pools)", chainMeta);
        continue;
      }

      const ckptT0 = Date.now();
      let checkpoint: DexPoolHourCheckpoint | null = await readCheckpoint(chainId);
      logScheduled(
        runStart,
        `checkpoint read +${Date.now() - ckptT0}ms completed_through=${checkpoint?.completed_through ?? "null"} fetch_cursor=${checkpoint?.fetch_cursor ? "yes" : "no"}`,
        chainMeta,
      );

      const storedCursor =
        checkpoint?.fetch_cursor &&
        checkpoint.fetch_cursor.pairs_count === pairs.length &&
        checkpoint.fetch_cursor.pairs_fingerprint === currentPairsFingerprint
          ? checkpoint.fetch_cursor
          : null;
      if (checkpoint?.fetch_cursor && storedCursor === null) {
        checkpoint = { completed_through: checkpoint.completed_through, fetch_cursor: null };
        await writeCheckpoint(chainId, checkpoint);
        logScheduled(runStart, "dropped stale fetch cursor (pairs_count mismatch or fingerprint stale)", chainMeta);
      }

      let goalLte: number;
      let sliceGt: number;
      let sliceLte: number;
      let resume: DexPoolHourFetchCursor | null = null;
      let completedThrough = checkpoint?.completed_through ?? null;

      if (storedCursor) {
        goalLte = storedCursor.goal_period_lte;
        sliceGt = storedCursor.period_gt;
        sliceLte = storedCursor.period_lte;
        resume = storedCursor;
        logScheduled(
          runStart,
          `resume fetch cursor goal=${goalLte} slice=${sliceGt}..${sliceLte} inner_gt=${resume.inner_period_gt} pairBatch=${resume.batch_index} skip=${resume.skip}`,
          chainMeta,
        );
      } else {
        if (completedThrough === null) {
          /**
           * No checkpoint yet: seed `completed_through` from `max(period_start_unix)` in the DB
           * so we resume from wherever existing rows end. Every subsequent advance is driven by
           * the persisted checkpoint, which is only written after every chunk of a slice is
           * successfully upserted.
           */
          const maxT0 = Date.now();
          const { data: maxRow } = await supabase
            .from("dex_pool_hour_prices")
            .select("period_start_unix")
            .eq("chain_id", chainId)
            .order("period_start_unix", { ascending: false })
            .limit(1)
            .maybeSingle();
          logScheduled(
            runStart,
            `dex_pool_hour_prices max (bootstrap seed) +${Date.now() - maxT0}ms lastStored=${maxRow?.period_start_unix ?? "null"}`,
            chainMeta,
          );
          completedThrough = maxRow?.period_start_unix ?? null;
        }

        if (completedThrough === null) {
          /** Fresh DB: fall back to the earliest period the subgraph knows about for our pools. */
          const subT0 = Date.now();
          const earliest = await fetchEarliestPoolHourPeriodStartUnix(chainId as SupportedChain, pairs);
          logScheduled(
            runStart,
            `subgraph earliest poolHour (our pools) +${Date.now() - subT0}ms periodStartUnix=${earliest ?? "null"}`,
            chainMeta,
          );
          if (earliest === null) {
            logScheduled(
              runStart,
              "skip (no earliest pool hour from subgraph; cannot seed backfill window)",
              chainMeta,
            );
            continue;
          }
          /** Exclusive periodStartUnix_gt; first hour H needs periodGt < H. */
          completedThrough = Math.max(0, earliest - 3600);
        }

        /**
         * Persist the seed now, before any fetch. If the upcoming subgraph fetch aborts we still
         * have a stable watermark on disk, so the next scheduled run doesn't re-seed from scratch
         * and can resume advancing the slice window toward `periodLte` on its own. Also ensures
         * the checkpoint row always exists in `key_value` after the first successful bootstrap.
         */
        if (checkpoint?.completed_through !== completedThrough) {
          await writeCheckpoint(chainId, { completed_through: completedThrough, fetch_cursor: null });
          logScheduled(runStart, `persisted seed completed_through=${completedThrough}`, chainMeta);
        }

        if (completedThrough >= periodLte) {
          logScheduled(
            runStart,
            `skip already through periodLte=${periodLte} (completed_through=${completedThrough})`,
            chainMeta,
          );
          continue;
        }

        goalLte = periodLte;
        sliceGt = completedThrough;
        sliceLte = Math.min(completedThrough + DEX_POOL_OUTER_SLICE_SEC, goalLte);
        if (sliceGt >= sliceLte) {
          logScheduled(runStart, `skip empty window sliceGt=${sliceGt} sliceLte=${sliceLte}`, chainMeta);
          continue;
        }
      }

      let totalInserted = 0;
      let abortedFetch = false;
      let slicesInRun = 0;

      while (sliceGt < goalLte && slicesInRun < MAX_SLICES_PER_SCHEDULED_RUN) {
        slicesInRun++;
        logScheduled(
          runStart,
          `subgraph fetch slice ${slicesInRun}/${MAX_SLICES_PER_SCHEDULED_RUN} window=${sliceGt}..${sliceLte} goalLte=${goalLte} sliceSec=${sliceLte - sliceGt}`,
          chainMeta,
        );
        const fetchT0 = Date.now();
        let result: FetchPoolHourDatasResult;
        try {
          result = await fetchPoolHourDatasSince(chainId as SupportedChain, pairs, sliceGt, sliceLte, goalLte, resume);
        } catch (fetchError) {
          logScheduled(runStart, `subgraph fetch failed +${Date.now() - fetchT0}ms, skipping chain`, chainMeta);
          console.error(
            `scheduled-dex-pool-prices +${Date.now() - runStart}ms chain=${chainId} fetchPoolHourDatasSince`,
            fetchError,
          );
          abortedFetch = true;
          break;
        }
        resume = null;

        const { rows, nextCursor } = result;
        logScheduled(
          runStart,
          `subgraph fetch done +${Date.now() - fetchT0}ms fetchedHourRows=${rows.length} nextCursor=${nextCursor ? `pairBatch=${nextCursor.batch_index} skip=${nextCursor.skip}` : "none"}`,
          chainMeta,
        );

        if (rows.length > 0) {
          const hourInserts = rows.map((r) => ({
            chain_id: chainId,
            pool_id: r.poolId,
            token0_id: r.token0Id,
            token1_id: r.token1Id,
            token0_price: r.token0Price,
            token1_price: r.token1Price,
            period_start_unix: r.periodStartUnix,
          }));

          const upsertBatches = Math.ceil(hourInserts.length / INSERT_CHUNK);
          for (let i = 0; i < hourInserts.length; i += INSERT_CHUNK) {
            const chunk = hourInserts.slice(i, i + INSERT_CHUNK);
            const upT0 = Date.now();
            const { error } = await supabase.from("dex_pool_hour_prices").upsert(chunk, {
              onConflict: "chain_id,pool_id,period_start_unix",
              ignoreDuplicates: false,
            });
            if (error) {
              throw error;
            }
            const batchIdx = Math.floor(i / INSERT_CHUNK) + 1;
            logScheduled(
              runStart,
              `upsert batch ${batchIdx}/${upsertBatches} size=${chunk.length} +${Date.now() - upT0}ms`,
              chainMeta,
            );
          }
          totalInserted += hourInserts.length;
        }

        if (nextCursor) {
          /** Paused mid-fetch: persist the resume cursor alongside the unchanged watermark. */
          await writeCheckpoint(chainId, {
            completed_through: completedThrough ?? sliceGt,
            fetch_cursor: nextCursor,
          });
          logScheduled(runStart, "saved fetch cursor for next run", chainMeta);
          break;
        }

        /**
         * Slice fully fetched and every chunk upsert above succeeded. Advance the watermark to
         * `sliceLte` and clear the fetch cursor in a single atomic upsert — a crash immediately
         * after the upserts still leaves the DB consistent (either the old checkpoint or the new
         * one is visible, never a half-state).
         */
        completedThrough = sliceLte;
        await writeCheckpoint(chainId, { completed_through: completedThrough, fetch_cursor: null });
        logScheduled(runStart, `advanced completed_through=${sliceLte}`, chainMeta);

        if (rows.length === 0) {
          logScheduled(runStart, "no rows from subgraph for this slice", chainMeta);
        }

        if (sliceLte >= goalLte) {
          break;
        }
        sliceGt = sliceLte;
        sliceLte = Math.min(sliceGt + DEX_POOL_OUTER_SLICE_SEC, goalLte);
      }

      if (abortedFetch) {
        continue;
      }

      logScheduled(runStart, `chain done insertedHourRows=${totalInserted}`, chainMeta);
    } catch (e) {
      console.error(
        `scheduled-dex-pool-prices +${Date.now() - runStart}ms chain=${chainId} chain+${Date.now() - chainStart}ms error`,
        e,
      );
    }
  }

  logScheduled(runStart, "run finished");
};
