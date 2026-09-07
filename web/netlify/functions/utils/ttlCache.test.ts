import { describe, expect, it } from "vitest";
import { type TtlCacheEntry, evictExpiredAndOldest } from "./ttlCache";

const NOW = 1_000_000;

function cacheOf(entries: [string, number][]): Map<string, TtlCacheEntry<string>> {
  return new Map(entries.map(([key, expiresAt]) => [key, { promise: Promise.resolve(key), expiresAt }]));
}

describe("evictExpiredAndOldest", () => {
  it("drops expired entries and keeps the fresh ones", () => {
    const cache = cacheOf([
      ["stale", NOW - 1],
      ["fresh", NOW + 1],
    ]);

    evictExpiredAndOldest(cache, NOW, 10);

    expect([...cache.keys()]).toEqual(["fresh"]);
  });

  it("treats an entry expiring exactly now as expired", () => {
    const cache = cacheOf([["edge", NOW]]);

    evictExpiredAndOldest(cache, NOW, 10);

    expect(cache.size).toBe(0);
  });

  it("evicts oldest-first until there is room for one more", () => {
    const cache = cacheOf([
      ["a", NOW + 1],
      ["b", NOW + 1],
      ["c", NOW + 1],
    ]);

    evictExpiredAndOldest(cache, NOW, 2);

    // Room for one more under the bound, and the two survivors are the most recently inserted.
    expect([...cache.keys()]).toEqual(["c"]);
  });

  it("leaves a cache below the bound untouched", () => {
    const cache = cacheOf([
      ["a", NOW + 1],
      ["b", NOW + 1],
    ]);

    evictExpiredAndOldest(cache, NOW, 8);

    expect([...cache.keys()]).toEqual(["a", "b"]);
  });

  it("counts a re-inserted key as the newest, not as its original slot", () => {
    const cache = cacheOf([
      ["a", NOW + 1],
      ["b", NOW + 1],
    ]);
    // The shape every caller uses: delete before rewriting, so a refresh moves the key to the back.
    cache.delete("a");
    cache.set("a", { promise: Promise.resolve("a"), expiresAt: NOW + 1 });

    evictExpiredAndOldest(cache, NOW, 2);

    expect([...cache.keys()]).toEqual(["a"]);
  });
});
