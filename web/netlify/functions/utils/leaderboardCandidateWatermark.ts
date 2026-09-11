import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase";

/**
 * How far each indexer-side candidate scan has walked on a chain.
 *
 * Both scans page the indexer in `timestamp` order and stop at a page cap. Without a watermark that
 * cap truncates silently, and always in the same place: the refresh asks for the whole history, so a
 * chain past the cap would only ever hand back its *oldest* transfers and no recent wallet could
 * become a candidate. Persisting the highest timestamp reached turns the cap into a resumable walk —
 * each run continues where the last one stopped, and a chain whose history is longer than one run
 * backfills over several of them without a separate backfill mode.
 *
 * Timestamps are unix seconds and the next scan re-reads from them inclusively. Overlapping a second
 * is deliberate and harmless: candidates are a set.
 */
export type CandidateScanWatermark = {
  routerCollateralTs: number;
  outcomeTradeTs: number;
};

export const EMPTY_CANDIDATE_SCAN_WATERMARK: CandidateScanWatermark = {
  routerCollateralTs: 0,
  outcomeTradeTs: 0,
};

/** KV key in `key_value`. Format is stable (`…_${chainId}`); value is a `CandidateScanWatermark`. */
export function candidateScanWatermarkKey(chainId: number): string {
  return `seer_pnl_leaderboard_candidate_scan_${chainId}`;
}

function readTimestamp(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function parseWatermark(value: unknown): CandidateScanWatermark {
  if (!value || typeof value !== "object") return { ...EMPTY_CANDIDATE_SCAN_WATERMARK };
  const record = value as Record<string, unknown>;
  return {
    routerCollateralTs: readTimestamp(record.routerCollateralTs),
    outcomeTradeTs: readTimestamp(record.outcomeTradeTs),
  };
}

/**
 * Never throws: a missing or unreadable watermark degrades to "scan from the beginning", which is
 * correct but slower, and is the same thing a fresh chain does.
 */
export async function readCandidateScanWatermark(
  supabase: SupabaseClient<Database>,
  chainId: number,
): Promise<CandidateScanWatermark> {
  const { data, error } = await supabase
    .from("key_value")
    .select("value")
    .eq("key", candidateScanWatermarkKey(chainId))
    .maybeSingle();

  if (error) {
    console.warn("pnl-leaderboard: candidate scan watermark unreadable", { chainId, error });
    return { ...EMPTY_CANDIDATE_SCAN_WATERMARK };
  }
  return parseWatermark(data?.value ?? null);
}

/**
 * Only ever moves forward. A scan that failed reports the watermark it started from, so a transient
 * indexer error re-reads that slice on the next run instead of skipping it.
 */
export async function writeCandidateScanWatermark(
  supabase: SupabaseClient<Database>,
  chainId: number,
  next: CandidateScanWatermark,
): Promise<void> {
  const { error } = await supabase.from("key_value").upsert(
    {
      key: candidateScanWatermarkKey(chainId),
      value: next as unknown as Database["public"]["Tables"]["key_value"]["Insert"]["value"],
    },
    { onConflict: "key" },
  );
  if (error) {
    // Losing the write costs a re-scan of one slice, not correctness.
    console.warn("pnl-leaderboard: candidate scan watermark not persisted", { chainId, error });
  }
}

/** Escape hatch behind `?rescanCandidates=1`: walk the whole history again from zero. */
export async function resetCandidateScanWatermark(supabase: SupabaseClient<Database>, chainId: number): Promise<void> {
  await writeCandidateScanWatermark(supabase, chainId, { ...EMPTY_CANDIDATE_SCAN_WATERMARK });
}
