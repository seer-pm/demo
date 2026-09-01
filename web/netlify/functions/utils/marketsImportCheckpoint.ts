import type { SupportedChain } from "@seer-pm/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase.ts";

/**
 * Re-scan window subtracted from the persisted cursor on every run. Absorbs indexer lag and
 * markets sharing an `updatedAt` with the boundary; the cost is negligible because a full day of
 * indexer activity is only a handful of markets.
 */
export const CURSOR_OVERLAP_SECONDS = 60 * 10;

/** Only used to seed `verification_synced_at` on the very first run for a chain. */
export const VERIFICATION_BOOTSTRAP_LOOKBACK_SECONDS = 60 * 60 * 5;

/**
 * Per-chain checkpoint for `scheduled-markets-import`, holding two independent cursors:
 *  - `markets_updated_at`: the highest Envio `Market.updatedAt` that was fetched **and** upserted
 *    end-to-end. Advanced only after every upsert chunk succeeds, so a crash mid-import cannot
 *    cause the next run to skip markets. It must stay on the same clock as the `updatedAt` filter
 *    it feeds — deriving it from market *creation* time is what made resolutions go missing.
 *  - `verification_synced_at`: wall-clock seconds up to which the Kleros curate sync completed.
 *    A different timeline entirely (curate request submission/resolution times), so it cannot
 *    share a variable with the market cursor.
 *
 * Both fields live in a single `key_value` row so every state transition is one atomic `upsert`.
 */
export const marketsImportCheckpointKey = (chainId: SupportedChain) => `markets_import_checkpoint_v1:${chainId}`;

export type MarketsImportCheckpoint = {
  markets_updated_at: number;
  verification_synced_at: number;
};

function isWatermark(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/** Returns `null` for anything malformed so the caller re-bootstraps instead of trusting garbage. */
export function parseMarketsImportCheckpoint(value: unknown): MarketsImportCheckpoint | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const o = value as Record<string, unknown>;
  if (!isWatermark(o.markets_updated_at) || !isWatermark(o.verification_synced_at)) {
    return null;
  }
  return { markets_updated_at: o.markets_updated_at, verification_synced_at: o.verification_synced_at };
}

/** Envio `updatedAt` lower bound for the next fetch. No checkpoint means a full bootstrap import. */
export function marketsUpdatedAtCursor(checkpoint: MarketsImportCheckpoint | null): number {
  if (!checkpoint) {
    return 0;
  }
  return Math.max(0, checkpoint.markets_updated_at - CURSOR_OVERLAP_SECONDS);
}

/** `sinceSeconds` for the curate sync: wall-clock, never the market cursor. */
export function verificationSince(checkpoint: MarketsImportCheckpoint | null, runStartedAt: number): number {
  if (!checkpoint) {
    return Math.max(0, runStartedAt - VERIFICATION_BOOTSTRAP_LOOKBACK_SECONDS);
  }
  return checkpoint.verification_synced_at;
}

/** Highest `updatedAt` in a fetched page set, or `null` when none is usable. */
export function maxUpdatedAt(markets: { updatedAt: string }[]): number | null {
  let max: number | null = null;
  for (const market of markets) {
    const updatedAt = Number(market.updatedAt);
    if (Number.isFinite(updatedAt) && (max === null || updatedAt > max)) {
      max = updatedAt;
    }
  }
  return max;
}

/** Next checkpoint for a chain that finished its import. Never moves a cursor backwards. */
export function advanceCheckpoint(
  previous: MarketsImportCheckpoint | null,
  { fetchedMaxUpdatedAt, verificationSyncedAt }: { fetchedMaxUpdatedAt: number | null; verificationSyncedAt: number },
): MarketsImportCheckpoint {
  return {
    markets_updated_at: Math.max(previous?.markets_updated_at ?? 0, fetchedMaxUpdatedAt ?? 0),
    verification_synced_at: Math.max(previous?.verification_synced_at ?? 0, verificationSyncedAt),
  };
}

export async function readMarketsImportCheckpoint(
  supabase: SupabaseClient,
  chainId: SupportedChain,
): Promise<MarketsImportCheckpoint | null> {
  const { data, error } = await supabase
    .from("key_value")
    .select("value")
    .eq("key", marketsImportCheckpointKey(chainId))
    .maybeSingle();
  if (error) {
    throw error;
  }

  return parseMarketsImportCheckpoint(data?.value ?? null);
}

export async function writeMarketsImportCheckpoint(
  supabase: SupabaseClient,
  chainId: SupportedChain,
  checkpoint: MarketsImportCheckpoint,
): Promise<void> {
  const { error } = await supabase.from("key_value").upsert(
    {
      key: marketsImportCheckpointKey(chainId),
      value: checkpoint as unknown as Database["public"]["Tables"]["key_value"]["Insert"]["value"],
    },
    { onConflict: "key" },
  );

  if (error) {
    throw error;
  }
}
