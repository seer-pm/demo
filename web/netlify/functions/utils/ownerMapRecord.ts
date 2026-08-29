import type { OwnerMap } from "./tradeExecutorOwnersCore";

export type OwnerMapRecord = {
  updatedAt: string | null;
  owners: OwnerMap;
  scannedOwners: string[];
};

type StoredOwnerMap = {
  updatedAt: string;
  owners: OwnerMap;
  scannedOwners?: string[];
};

/** Re-probe CREATE2 executors at most this often; otherwise reuse KV + scanned owners. */
export const OWNER_MAP_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * Read the KV row into a record every consumer can key by lowercase address.
 *
 * The row outlives the revision that wrote it, so its casing is not ours to trust: a checksummed
 * executor key or owner value from an older writer would miss every lookup downstream — silently
 * dropping the executor from the refresh list in `withExecutors`, and splitting the owner's rows
 * across two group keys in `rollUpRows`. Normalize once here rather than at each lookup.
 */
export function parseOwnerMapRecord(value: unknown): OwnerMapRecord {
  if (!value || typeof value !== "object") {
    return { updatedAt: null, owners: {}, scannedOwners: [] };
  }
  const stored = value as StoredOwnerMap;
  const storedOwners =
    stored.owners && typeof stored.owners === "object" && !Array.isArray(stored.owners) ? stored.owners : {};
  const owners: OwnerMap = {};
  for (const [executor, owner] of Object.entries(storedOwners)) {
    // Skip rather than coerce: a malformed row must not inject "undefined" as an owner address.
    if (typeof owner !== "string") continue;
    owners[executor.toLowerCase()] = owner.toLowerCase();
  }
  const scannedOwners = Array.isArray(stored.scannedOwners)
    ? [...new Set(stored.scannedOwners.map((address) => address.toLowerCase()))]
    : [];
  return {
    updatedAt: typeof stored.updatedAt === "string" ? stored.updatedAt : null,
    owners,
    scannedOwners,
  };
}

export function isOwnerMapStale(record: OwnerMapRecord, now = Date.now(), ttlMs = OWNER_MAP_TTL_MS): boolean {
  if (record.scannedOwners.length === 0) return true;
  if (!record.updatedAt) return true;
  const ts = Date.parse(record.updatedAt);
  if (!Number.isFinite(ts)) return true;
  return now - ts > ttlMs;
}

/** Addresses that have not been probed yet (not a scanned EOA, executor key, or mapped owner). */
export function unknownOwnerCandidates(candidates: string[], record: OwnerMapRecord): string[] {
  const known = new Set(record.scannedOwners);
  for (const [executor, owner] of Object.entries(record.owners)) {
    known.add(executor.toLowerCase());
    known.add(owner.toLowerCase());
  }
  const seen = new Set<string>();
  const unknown: string[] = [];
  for (const address of candidates) {
    const lower = address.toLowerCase();
    if (!lower || seen.has(lower)) continue;
    seen.add(lower);
    if (!known.has(lower)) unknown.push(lower);
  }
  return unknown;
}
