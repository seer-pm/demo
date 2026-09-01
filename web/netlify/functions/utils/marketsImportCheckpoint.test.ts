import { describe, expect, it } from "vitest";
import {
  CURSOR_OVERLAP_SECONDS,
  VERIFICATION_BOOTSTRAP_LOOKBACK_SECONDS,
  advanceCheckpoint,
  marketsUpdatedAtCursor,
  maxUpdatedAt,
  parseMarketsImportCheckpoint,
  verificationSince,
} from "./marketsImportCheckpoint";

const checkpoint = { markets_updated_at: 1_800_000_000, verification_synced_at: 1_799_000_000 };

describe("parseMarketsImportCheckpoint", () => {
  it("accepts a well-formed checkpoint", () => {
    expect(parseMarketsImportCheckpoint({ ...checkpoint })).toEqual(checkpoint);
  });

  it("rejects anything malformed so the caller re-bootstraps", () => {
    expect(parseMarketsImportCheckpoint(null)).toBeNull();
    expect(parseMarketsImportCheckpoint("nope")).toBeNull();
    expect(parseMarketsImportCheckpoint({ markets_updated_at: 1 })).toBeNull();
    expect(parseMarketsImportCheckpoint({ markets_updated_at: Number.NaN, verification_synced_at: 1 })).toBeNull();
    expect(parseMarketsImportCheckpoint({ markets_updated_at: -1, verification_synced_at: 1 })).toBeNull();
    expect(parseMarketsImportCheckpoint({ markets_updated_at: "1", verification_synced_at: 1 })).toBeNull();
  });
});

describe("marketsUpdatedAtCursor", () => {
  it("bootstraps with a full import when there is no checkpoint", () => {
    expect(marketsUpdatedAtCursor(null)).toBe(0);
  });

  it("re-scans an overlap window behind the persisted cursor", () => {
    expect(marketsUpdatedAtCursor(checkpoint)).toBe(checkpoint.markets_updated_at - CURSOR_OVERLAP_SECONDS);
  });

  it("never goes below zero", () => {
    expect(marketsUpdatedAtCursor({ markets_updated_at: 5, verification_synced_at: 5 })).toBe(0);
  });
});

describe("verificationSince", () => {
  it("seeds a lookback window on the first run", () => {
    expect(verificationSince(null, 1_800_000_000)).toBe(1_800_000_000 - VERIFICATION_BOOTSTRAP_LOOKBACK_SECONDS);
  });

  it("uses the wall-clock cursor, not the market cursor", () => {
    expect(verificationSince(checkpoint, 1_800_500_000)).toBe(checkpoint.verification_synced_at);
  });
});

describe("maxUpdatedAt", () => {
  it("returns the highest value", () => {
    expect(maxUpdatedAt([{ updatedAt: "10" }, { updatedAt: "300" }, { updatedAt: "20" }])).toBe(300);
  });

  it("returns null when there is nothing usable", () => {
    expect(maxUpdatedAt([])).toBeNull();
    expect(maxUpdatedAt([{ updatedAt: "abc" }])).toBeNull();
  });

  it("ignores unparsable entries", () => {
    expect(maxUpdatedAt([{ updatedAt: "abc" }, { updatedAt: "42" }])).toBe(42);
  });
});

describe("advanceCheckpoint", () => {
  it("advances both cursors", () => {
    expect(
      advanceCheckpoint(checkpoint, { fetchedMaxUpdatedAt: 1_800_000_500, verificationSyncedAt: 1_800_000_400 }),
    ).toEqual({ markets_updated_at: 1_800_000_500, verification_synced_at: 1_800_000_400 });
  });

  it("never moves a cursor backwards", () => {
    expect(advanceCheckpoint(checkpoint, { fetchedMaxUpdatedAt: 1, verificationSyncedAt: 1 })).toEqual(checkpoint);
  });

  it("holds the market cursor when a run fetched nothing", () => {
    expect(advanceCheckpoint(checkpoint, { fetchedMaxUpdatedAt: null, verificationSyncedAt: 1_800_000_400 })).toEqual({
      markets_updated_at: checkpoint.markets_updated_at,
      verification_synced_at: 1_800_000_400,
    });
  });

  it("bootstraps from no previous checkpoint", () => {
    expect(advanceCheckpoint(null, { fetchedMaxUpdatedAt: 10, verificationSyncedAt: 20 })).toEqual({
      markets_updated_at: 10,
      verification_synced_at: 20,
    });
  });
});
