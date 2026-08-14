import { getStore } from "@netlify/blobs";

/** Safety TTL so resolved markets / prices don't freeze until the wallet moves again. */
export const PORTFOLIO_BLOB_TTL_MS = 10 * 60 * 1000;

export type ActivityCachedPayload<T> = {
  cachedAt: number;
  lastActivityTs: number;
} & T;

export function isActivityCacheFresh<T extends { cachedAt: number; lastActivityTs: number }>(
  cached: T | null | undefined,
  currentLastActivityTs: number,
  ttlMs = PORTFOLIO_BLOB_TTL_MS,
): cached is T {
  if (!cached) return false;
  if (typeof cached.cachedAt !== "number" || typeof cached.lastActivityTs !== "number") return false;
  if (Date.now() - cached.cachedAt >= ttlMs) return false;
  return currentLastActivityTs <= cached.lastActivityTs;
}

function blobStore(name: string) {
  return getStore({
    name,
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN,
  });
}

export async function readJsonBlob<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const value = await blobStore(storeName).get(key, { type: "json" });
    return (value as T | null) ?? null;
  } catch (error) {
    console.warn("portfolio blob get failed", { storeName, key, error });
    return null;
  }
}

export async function writeJsonBlob(storeName: string, key: string, value: unknown): Promise<void> {
  try {
    await blobStore(storeName).setJSON(key, value);
  } catch (error) {
    console.warn("portfolio blob set failed", { storeName, key, error });
  }
}
