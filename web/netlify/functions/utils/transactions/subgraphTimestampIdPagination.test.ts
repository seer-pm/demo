import { describe, expect, it } from "vitest";
import { hitLimit, paginateByTimestampId } from "./subgraphTimestampIdPagination";

type Row = { id: string; timestamp: string };

/**
 * Stand-in for a subgraph page fetch. Rows are newest-first and handed out sequentially, which
 * is what a correct cursor-following backend does; `calls` records the `first` asked for each
 * time so we can assert we never over-fetch.
 */
function makeSource(total: number) {
  const rows: Row[] = Array.from({ length: total }, (_, i) => ({
    id: `id-${i}`,
    timestamp: String(1_000_000 - i),
  }));
  const calls: number[] = [];
  let served = 0;
  return {
    calls,
    fetchPage: async (_where: Record<string, unknown>, first: number) => {
      calls.push(first);
      const page = rows.slice(served, served + first);
      served += page.length;
      return page;
    },
  };
}

const base = { accountFilters: [{ origin: "0xabc" }] };

describe("paginateByTimestampId", () => {
  it("paginates to exhaustion when maxRows is not set", async () => {
    const src = makeSource(250);
    const out = await paginateByTimestampId<Row>({ ...base, pageSize: 100, fetchPage: src.fetchPage });

    expect(out).toHaveLength(250);
    expect(src.calls).toEqual([100, 100, 100]);
  });

  it("stops at maxRows and never asks for more than it needs", async () => {
    const src = makeSource(10_000);
    const out = await paginateByTimestampId<Row>({
      ...base,
      pageSize: 1000,
      maxRows: 250,
      fetchPage: src.fetchPage,
    });

    expect(out).toHaveLength(250);
    // One round trip for 250 rows, not a 1000-row page we then throw most of away.
    expect(src.calls).toEqual([250]);
  });

  it("caps across multiple pages when maxRows exceeds pageSize", async () => {
    const src = makeSource(10_000);
    const out = await paginateByTimestampId<Row>({
      ...base,
      pageSize: 100,
      maxRows: 150,
      fetchPage: src.fetchPage,
    });

    expect(out).toHaveLength(150);
    expect(src.calls).toEqual([100, 50]);
  });

  it("returns the newest rows first", async () => {
    const src = makeSource(1000);
    const out = await paginateByTimestampId<Row>({ ...base, maxRows: 3, fetchPage: src.fetchPage });

    expect(out.map((r) => r.id)).toEqual(["id-0", "id-1", "id-2"]);
  });

  it("terminates when the source has fewer rows than the cap", async () => {
    const src = makeSource(120);
    const out = await paginateByTimestampId<Row>({
      ...base,
      pageSize: 100,
      maxRows: 500,
      fetchPage: src.fetchPage,
    });

    expect(out).toHaveLength(120);
    // Page size still bounds each request; the short second page (20 rows) ends it, so the cap
    // must not keep the loop spinning.
    expect(src.calls).toEqual([100, 100]);
  });

  it("treats maxRows <= 0 as uncapped", async () => {
    const src = makeSource(150);
    const out = await paginateByTimestampId<Row>({
      ...base,
      pageSize: 100,
      maxRows: 0,
      fetchPage: src.fetchPage,
    });

    expect(out).toHaveLength(150);
  });

  it("dedupes ids repeated across pages", async () => {
    let call = 0;
    const dup: Row[] = [
      { id: "a", timestamp: "3" },
      { id: "b", timestamp: "2" },
    ];
    const out = await paginateByTimestampId<Row>({
      ...base,
      pageSize: 2,
      fetchPage: async () => {
        call += 1;
        return call === 1 ? dup : [{ id: "b", timestamp: "2" }];
      },
    });

    expect(out.map((r) => r.id)).toEqual(["a", "b"]);
  });
});

describe("hitLimit", () => {
  it("is false when no limit is set", () => {
    expect(hitLimit({ length: 9999 }, undefined)).toBe(false);
    expect(hitLimit({ length: 9999 }, 0)).toBe(false);
  });

  it("is true only once the row count reaches the limit", () => {
    expect(hitLimit({ length: 249 }, 250)).toBe(false);
    expect(hitLimit({ length: 250 }, 250)).toBe(true);
  });
});
