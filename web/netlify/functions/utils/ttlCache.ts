/**
 * One entry in a promise memo: the in-flight or settled work, and when it stops being served.
 *
 * The promise is what gets cached, not its result, so concurrent misses on one key share a single
 * piece of work instead of racing to duplicate it.
 */
export type TtlCacheEntry<T> = { promise: Promise<T>; expiresAt: number };

/**
 * Drops every expired entry, then the oldest until there is room for one more under `maxSize`.
 *
 * Insertion order is the eviction order, which is only correct because `Map` iterates in insertion
 * order and every caller deletes a key before rewriting it: a refreshed entry moves to the back
 * rather than keeping the slot it was first inserted at, so the oldest key really is the least
 * recently written one.
 *
 * Generic over the entry rather than taking `Map<string, { expiresAt: number }>` so a caller's
 * richer entry type is accepted on its own terms instead of via method bivariance.
 */
export function evictExpiredAndOldest<E extends { expiresAt: number }>(
  cache: Map<string, E>,
  now: number,
  maxSize: number,
): void {
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
  while (cache.size >= maxSize) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}
