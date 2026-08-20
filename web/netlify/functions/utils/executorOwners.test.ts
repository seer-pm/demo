import { describe, expect, it } from "vitest";
import { type OwnerMapRecord, isOwnerMapStale, parseOwnerMapRecord, unknownOwnerCandidates } from "./ownerMapRecord";

const OWNER = "0x1111111111111111111111111111111111111111";
const EXECUTOR = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const OTHER = "0x2222222222222222222222222222222222222222";

function record(overrides: Partial<OwnerMapRecord> = {}): OwnerMapRecord {
  return {
    updatedAt: new Date().toISOString(),
    owners: { [EXECUTOR]: OWNER },
    scannedOwners: [OWNER],
    ...overrides,
  };
}

describe("parseOwnerMapRecord", () => {
  it("treats missing scannedOwners as empty (legacy KV)", () => {
    const parsed = parseOwnerMapRecord({
      updatedAt: "2026-08-19T00:00:00.000Z",
      owners: { [EXECUTOR]: OWNER },
    });
    expect(parsed.scannedOwners).toEqual([]);
    expect(parsed.owners[EXECUTOR]).toBe(OWNER);
  });
});

describe("isOwnerMapStale", () => {
  it("is stale when scannedOwners is empty", () => {
    expect(isOwnerMapStale(record({ scannedOwners: [] }))).toBe(true);
  });

  it("is fresh within TTL", () => {
    expect(isOwnerMapStale(record(), Date.now(), 60_000)).toBe(false);
  });

  it("is stale after TTL", () => {
    const updatedAt = new Date(Date.now() - 120_000).toISOString();
    expect(isOwnerMapStale(record({ updatedAt }), Date.now(), 60_000)).toBe(true);
  });
});

describe("unknownOwnerCandidates", () => {
  it("skips scanned owners and mapped executors", () => {
    expect(unknownOwnerCandidates([OWNER, EXECUTOR, OTHER], record())).toEqual([OTHER]);
  });

  it("dedupes and lowercases", () => {
    expect(unknownOwnerCandidates([OTHER.toUpperCase(), OTHER], record())).toEqual([OTHER]);
  });
});
