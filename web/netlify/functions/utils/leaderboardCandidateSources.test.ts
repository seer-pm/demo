import { beforeEach, describe, expect, it, vi } from "vitest";

// `pnlLeaderboard` pulls in `executorOwners`, which builds a Supabase client at import time.
// Hoisted so the placeholders are in place before the ESM imports below run. Nothing here reaches
// the network: the only client that would is the stand-in passed into the function under test.
vi.hoisted(() => {
  process.env.SUPABASE_PROJECT_URL ||= "http://supabase.test";
  process.env.SUPABASE_API_KEY ||= "test-key";
});

const GetTransfers = vi.fn();

vi.mock("./envioClient", () => ({
  seerEnvioSdk: () => ({ GetTransfers }),
}));

import { listLeaderboardCandidates } from "./pnlLeaderboard";

const CHAIN = 10 as const;
const DAY = 86_400;

/** The owner EOA never signs its own trades, so the analytics rollups never name it. */
const OWNER = "0x02dadbe42f385fa68f96c753df7f24c863701481";
/** Holds the tokens, so the indexer sees it even though it is never a tx sender. */
const EXECUTOR = "0x7f93d9e40f0b393d2d5506d618aa0526496f374f";
/** What `tokens_transfers.tx_from` actually records for those trades. */
const RELAYER = "0x4d684bbc7296a913f95257b7d5659047031f65e6";
/** The deployed optimism router — the scan drops it through `getRouterAddresses(10)`. */
const ROUTER = "0x179d8f8c811b8c759c33809dbc6c5cedc62d05dd";
const PRIMARY = "0xb5b2dc7fd34c249f4be7fb1fcea07950784229e0";

/** Minimal `supabase.from(...).select(...)…range()` chain: analytics returns `rows` once. */
function supabaseReturning(rows: { address: string; day: number }[]) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "in", "gte", "order"]) {
    builder[method] = () => builder;
  }
  builder.range = (from: number) => Promise.resolve({ data: from === 0 ? rows : [], error: null });
  // biome-ignore lint/suspicious/noExplicitAny: hand-rolled stand-in for the query builder
  return { from: () => builder } as any;
}

/** A primary-collateral leg between `wallet` and the router, as the indexer books it. */
function routerCollateralRow(wallet: string, timestamp: number, toRouter = true) {
  return {
    chainId: String(CHAIN),
    from: toRouter ? wallet : ROUTER,
    to: toRouter ? ROUTER : wallet,
    timestamp: String(timestamp),
    blockNumber: "1",
    transactionHash: "0xabc",
    transactionFrom: RELAYER,
    logIndex: "1",
    value: "1000",
    kind: "router_collateral",
    involvesRouter: true,
    market: null,
    token: { id: PRIMARY },
  };
}

beforeEach(() => {
  GetTransfers.mockReset();
});

describe("listLeaderboardCandidates", () => {
  it("reaches a wallet that only ever traded through a relayer-driven executor", async () => {
    GetTransfers.mockResolvedValueOnce({ Transfer: [routerCollateralRow(EXECUTOR, 10 * DAY + 500)] });

    const candidates = await listLeaderboardCandidates(
      supabaseReturning([{ address: RELAYER, day: 9 * DAY }]),
      CHAIN,
      undefined,
      {
        cutoffDay: 0,
      },
    );

    const addresses = candidates.map((c) => c.address);
    // The executor is the whole point: analytics only ever saw the relayer that signed for it.
    expect(addresses).toContain(EXECUTOR);
    expect(addresses).toContain(RELAYER);
    expect(addresses).not.toContain(OWNER);
    // Timestamps arrive in seconds and have to land on the same UTC-day grain as the analytics half.
    expect(candidates.find((c) => c.address === EXECUTOR)?.lastActivityDay).toBe(10 * DAY);
  });

  it("keeps the latest activity day when both sources name the same wallet", async () => {
    GetTransfers.mockResolvedValueOnce({ Transfer: [routerCollateralRow(RELAYER, 12 * DAY, false)] });

    const candidates = await listLeaderboardCandidates(
      supabaseReturning([{ address: RELAYER, day: 9 * DAY }]),
      CHAIN,
      undefined,
      {
        cutoffDay: 0,
      },
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0].lastActivityDay).toBe(12 * DAY);
  });

  it("still returns the analytics half when the indexer scan fails", async () => {
    GetTransfers.mockRejectedValueOnce(new Error("indexer down"));

    const candidates = await listLeaderboardCandidates(
      supabaseReturning([{ address: RELAYER, day: 9 * DAY }]),
      CHAIN,
      undefined,
      {
        cutoffDay: 0,
      },
    );

    // Degrading to the old coverage beats blanking a board the analytics half could refresh.
    expect(candidates.map((c) => c.address)).toEqual([RELAYER]);
  });

  it("asks the indexer for router collateral only, never for every token holder", async () => {
    // The holder view (`AccountActivity`) would hand back every Uniswap pool on the chain, and a
    // pool's P/L is its inventory. Collateral moving with the router is what a pool never does.
    GetTransfers.mockResolvedValueOnce({ Transfer: [] });

    await listLeaderboardCandidates(supabaseReturning([]), CHAIN, undefined, { cutoffDay: 3 * DAY });

    expect(GetTransfers).toHaveBeenCalledTimes(1);
    expect(GetTransfers.mock.calls[0][0].where).toMatchObject({
      kind: { _eq: "router_collateral" },
      timestamp: { _gte: String(3 * DAY) },
    });
  });

  it("never lists the router itself or the zero address as a candidate", async () => {
    GetTransfers.mockResolvedValueOnce({
      Transfer: [
        routerCollateralRow(EXECUTOR, 10 * DAY),
        { ...routerCollateralRow(EXECUTOR, 10 * DAY), from: "0x0000000000000000000000000000000000000000", to: ROUTER },
      ],
    });

    const candidates = await listLeaderboardCandidates(supabaseReturning([]), CHAIN, undefined, { cutoffDay: 0 });

    expect(candidates.map((c) => c.address)).toEqual([EXECUTOR]);
  });

  it("leaves market-scoped jobs on the analytics source alone", async () => {
    const candidates = await listLeaderboardCandidates(
      supabaseReturning([{ address: RELAYER, day: 9 * DAY }]),
      CHAIN,
      ["0xaaaa000000000000000000000000000000000001"],
      { cutoffDay: 0 },
    );

    expect(candidates.map((c) => c.address)).toEqual([RELAYER]);
    expect(GetTransfers).not.toHaveBeenCalled();
  });
});
