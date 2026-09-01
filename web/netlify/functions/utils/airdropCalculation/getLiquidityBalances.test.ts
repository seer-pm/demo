import { describe, expect, it } from "vitest";
import {
  type LiquidityEvent,
  fetchLiquidityEventsForBatch,
  getLiquidityPositionsAtTimestamp,
  getPoolAddresses,
} from "./getLiquidityBalances";

const A = "0xaaaa";
const B = "0xbbbb";
const T0 = "0x0000000000000000000000000000000000000001";
const T1 = "0x0000000000000000000000000000000000000002";
const POOL = "0x00000000000000000000000000000000000000p0";

function event(over: Partial<LiquidityEvent> & { type: "mint" | "burn" }): LiquidityEvent {
  return {
    id: Math.random().toString(),
    pool: { id: POOL },
    token0: { id: T0, symbol: "T0" },
    token1: { id: T1, symbol: "T1" },
    amount: "1000",
    amount0: "0",
    amount1: "0",
    tickLower: "-6000",
    tickUpper: "6000",
    timestamp: "100",
    origin: A,
    ...over,
  };
}

describe("getLiquidityPositionsAtTimestamp", () => {
  it("nets mints and burns into one position", () => {
    const positions = getLiquidityPositionsAtTimestamp(
      [event({ type: "mint", amount: "1000" }), event({ type: "burn", amount: "400" })],
      1_000,
    );
    expect(positions).toHaveLength(1);
    expect(positions[0].liquidity).toBe(600n);
    expect(positions[0].origin).toBe(A);
  });

  it("ignores events after the snapshot", () => {
    const positions = getLiquidityPositionsAtTimestamp(
      [
        event({ type: "mint", amount: "1000", timestamp: "100" }),
        event({ type: "mint", amount: "5", timestamp: "500" }),
      ],
      200,
    );
    expect(positions[0].liquidity).toBe(1000n);
  });

  it("drops fully closed positions", () => {
    const positions = getLiquidityPositionsAtTimestamp(
      [event({ type: "mint", amount: "1000" }), event({ type: "burn", amount: "1000" })],
      1_000,
    );
    expect(positions).toEqual([]);
  });

  it("drops positions that net negative", () => {
    // A burn seen without its mint would otherwise produce a negative valuation.
    const positions = getLiquidityPositionsAtTimestamp([event({ type: "burn", amount: "1000" })], 1_000);
    expect(positions).toEqual([]);
  });

  it("keeps distinct tick ranges apart", () => {
    const positions = getLiquidityPositionsAtTimestamp(
      [
        event({ type: "mint", amount: "1000", tickLower: "-6000", tickUpper: "6000" }),
        event({ type: "mint", amount: "700", tickLower: "-120", tickUpper: "120" }),
      ],
      1_000,
    );
    expect(positions).toHaveLength(2);
    expect(positions.map((p) => p.liquidity).sort((a, b) => Number(a - b))).toEqual([700n, 1000n]);
  });

  it("keeps distinct owners apart", () => {
    const positions = getLiquidityPositionsAtTimestamp(
      [event({ type: "mint", amount: "1000", origin: A }), event({ type: "mint", amount: "700", origin: B })],
      1_000,
    );
    expect(positions).toHaveLength(2);
  });

  it("excludes the zero address", () => {
    const positions = getLiquidityPositionsAtTimestamp(
      [event({ type: "mint", amount: "1000", origin: "0x0000000000000000000000000000000000000000" })],
      1_000,
    );
    expect(positions).toEqual([]);
  });

  it("parses tick bounds as numbers", () => {
    const [position] = getLiquidityPositionsAtTimestamp(
      [event({ type: "mint", tickLower: "-120", tickUpper: "240" })],
      1_000,
    );
    expect(position.tickLower).toBe(-120);
    expect(position.tickUpper).toBe(240);
  });
});

describe("getPoolAddresses", () => {
  it("collects pool addresses, lowercased and deduped", () => {
    const addresses = getPoolAddresses([
      event({ type: "mint", pool: { id: "0xAABB" } }),
      event({ type: "burn", pool: { id: "0xaabb" } }),
      event({ type: "mint", pool: { id: "0xCCDD" } }),
    ]);
    expect(addresses).toEqual(new Set(["0xaabb", "0xccdd"]));
  });

  it("skips events with no pool rather than adding an empty entry", () => {
    const addresses = getPoolAddresses([
      { ...event({ type: "mint" }), pool: undefined as unknown as { id: string } },
      event({ type: "mint", pool: { id: "0xaabb" } }),
    ]);
    expect(addresses).toEqual(new Set(["0xaabb"]));
  });
});

describe("fetchLiquidityEventsForBatch", () => {
  const PAIRS = [{ token0: T0, token1: T1 }] as Parameters<typeof fetchLiquidityEventsForBatch>[2];

  /** A fake subgraph that serves `pages` in order and records the queries it was asked. */
  function fakeSubgraph(pages: LiquidityEvent[][]) {
    const queries: string[] = [];
    let call = 0;
    return {
      queries,
      request: async (_url: string, query: string) => {
        queries.push(query);
        return { data: { mints: pages[call++] ?? [] } };
      },
    };
  }

  const page = (size: number, from: number, over: Partial<Omit<LiquidityEvent, "type">> = {}) =>
    Array.from({ length: size }, (_, i) => event({ type: "mint", id: `0xtx${from + i}#0`, ...over }));

  it("follows every page until an empty one", async () => {
    const { request, queries } = fakeSubgraph([page(1000, 0), page(1000, 1000), page(1000, 2000), []]);
    const events = await fetchLiquidityEventsForBatch("mints", "http://subgraph", PAIRS, request);
    expect(events).toHaveLength(3000);
    expect(queries).toHaveLength(4);
  });

  it("does not stop on a short page", async () => {
    // The gateway can cap a response independently of `first`, so a short page is not the end.
    const { request } = fakeSubgraph([page(500, 0), page(3, 500), []]);
    const events = await fetchLiquidityEventsForBatch("mints", "http://subgraph", PAIRS, request);
    expect(events).toHaveLength(503);
  });

  it("keeps paging when a whole page shares one timestamp", async () => {
    // The regression this replaces: the timestamp cursor could not advance past a full page inside
    // a single timestamp, so it broke out and abandoned the rest of the batch.
    const { request } = fakeSubgraph([page(1000, 0, { timestamp: "100" }), page(1, 1000, { timestamp: "100" }), []]);
    const events = await fetchLiquidityEventsForBatch("mints", "http://subgraph", PAIRS, request);
    expect(events).toHaveLength(1001);
  });

  it("cursors on the last id, not on a timestamp", async () => {
    const { request, queries } = fakeSubgraph([page(1000, 0), []]);
    await fetchLiquidityEventsForBatch("mints", "http://subgraph", PAIRS, request);
    expect(queries[0]).not.toContain("_gt");
    expect(queries[1]).toContain('id_gt: "0xtx999#0"');
    expect(queries[1]).not.toContain("timestamp_gt");
    expect(queries[1]).toContain("orderBy: id");
  });

  it("stops rather than looping when a page carries no ids", async () => {
    const { request } = fakeSubgraph([[{ ...event({ type: "mint" }), id: "" }], []]);
    const events = await fetchLiquidityEventsForBatch("mints", "http://subgraph", PAIRS, request);
    expect(events).toHaveLength(1);
  });

  it("treats a missing entity in the response as the end", async () => {
    const request = async () => ({ data: {} });
    const events = await fetchLiquidityEventsForBatch("mints", "http://subgraph", PAIRS, request);
    expect(events).toEqual([]);
  });
});
