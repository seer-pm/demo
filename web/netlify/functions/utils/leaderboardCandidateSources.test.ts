import { beforeEach, describe, expect, it, vi } from "vitest";

// `pnlLeaderboard` pulls in `executorOwners`, which builds a Supabase client at import time.
// Hoisted so the placeholders are in place before the ESM imports below run. Nothing here reaches
// the network: the only client that would is the stand-in passed into the function under test.
vi.hoisted(() => {
  process.env.SUPABASE_PROJECT_URL ||= "http://supabase.test";
  process.env.SUPABASE_API_KEY ||= "test-key";
});

const GetAccountActivitiesByChain = vi.fn();

vi.mock("./envioClient", () => ({
  seerEnvioSdk: () => ({ GetAccountActivitiesByChain }),
}));

import { listLeaderboardCandidates } from "./pnlLeaderboard";

const CHAIN = 10;
const DAY = 86_400;

/** The owner EOA never signs its own trades, so the analytics rollups never name it. */
const OWNER = "0x02dadbe42f385fa68f96c753df7f24c863701481";
/** Holds the tokens, so the indexer sees it even though it is never a tx sender. */
const EXECUTOR = "0x7f93d9e40f0b393d2d5506d618aa0526496f374f";
/** What `tokens_transfers.tx_from` actually records for those trades. */
const RELAYER = "0x4d684bbc7296a913f95257b7d5659047031f65e6";

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

function activityRow(account: string, lastTransferTimestamp: number) {
  return {
    id: `${CHAIN}:${account}`,
    chainId: String(CHAIN),
    account,
    earliestTransferTimestamp: "0",
    lastTransferTimestamp: String(lastTransferTimestamp),
    transferCount: "1",
  };
}

beforeEach(() => {
  GetAccountActivitiesByChain.mockReset();
});

describe("listLeaderboardCandidates", () => {
  it("reaches a wallet that only ever traded through a relayer-driven executor", async () => {
    GetAccountActivitiesByChain.mockResolvedValueOnce({
      AccountActivity: [activityRow(EXECUTOR, 10 * DAY + 500)],
    });

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
    GetAccountActivitiesByChain.mockResolvedValueOnce({
      AccountActivity: [activityRow(RELAYER, 12 * DAY)],
    });

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
    GetAccountActivitiesByChain.mockRejectedValueOnce(new Error("indexer down"));

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

  it("leaves market-scoped jobs on the analytics source alone", async () => {
    const candidates = await listLeaderboardCandidates(
      supabaseReturning([{ address: RELAYER, day: 9 * DAY }]),
      CHAIN,
      ["0xaaaa000000000000000000000000000000000001"],
      { cutoffDay: 0 },
    );

    expect(candidates.map((c) => c.address)).toEqual([RELAYER]);
    expect(GetAccountActivitiesByChain).not.toHaveBeenCalled();
  });
});
