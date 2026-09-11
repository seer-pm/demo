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

const chainPoolAddressSet = vi.fn();

vi.mock("./leaderboardPools", () => ({
  chainPoolAddressSet: (...args: unknown[]) => chainPoolAddressSet(...args),
}));

import { listLeaderboardCandidates } from "./pnlLeaderboard";

const CHAIN = 10 as const;
const DAY = 86_400;
/** Mirrors `PAGE` in `seerIndexerPortfolio`: a short page is what tells a scan the stream ended. */
const PAGE = 1000;

/** The owner EOA never signs its own trades, so the analytics rollups never name it. */
const OWNER = "0x02dadbe42f385fa68f96c753df7f24c863701481";
/** Holds the tokens, so the indexer sees it even though it is never a tx sender. */
const EXECUTOR = "0x7f93d9e40f0b393d2d5506d618aa0526496f374f";
/** What `tokens_transfers.tx_from` actually records for those trades. */
const RELAYER = "0x4d684bbc7296a913f95257b7d5659047031f65e6";
/** The deployed optimism router — the scan drops it through `getRouterAddresses(10)`. */
const ROUTER = "0x179d8f8c811b8c759c33809dbc6c5cedc62d05dd";
const PRIMARY = "0xb5b2dc7fd34c249f4be7fb1fcea07950784229e0";
/** An outcome-token pool. Its P/L would be its inventory, so it must never be a candidate. */
const POOL = "0x1111111111111111111111111111111111111111";
const POOL2 = "0x2222222222222222222222222222222222222222";
/** A wallet with no relationship to any pool — an airdrop counterparty. */
const OUTSIDER = "0x3333333333333333333333333333333333333333";
const ZERO = "0x0000000000000000000000000000000000000000";

const POOLS = new Set([POOL, POOL2]);

type TransferRow = ReturnType<typeof transferRow>;

function transferRow(kind: string, from: string, to: string, timestamp: number) {
  return {
    chainId: String(CHAIN),
    from,
    to,
    timestamp: String(timestamp),
    blockNumber: "1",
    transactionHash: "0xabc",
    transactionFrom: RELAYER,
    logIndex: "1",
    value: "1000",
    kind,
    involvesRouter: kind === "router_collateral",
    market: null,
    token: { id: PRIMARY },
  };
}

/** A primary-collateral leg between `wallet` and the router, as the indexer books it. */
function routerCollateralRow(wallet: string, timestamp: number, toRouter = true) {
  return toRouter
    ? transferRow("router_collateral", wallet, ROUTER, timestamp)
    : transferRow("router_collateral", ROUTER, wallet, timestamp);
}

/** An outcome-token leg of a swap: the pool on one side, whoever traded on the other. */
function outcomeRow(from: string, to: string, timestamp: number) {
  return transferRow("outcome", from, to, timestamp);
}

/**
 * Answer `GetTransfers` per `kind`, since the protocol-wide path now runs two scans. A kind with no
 * entry returns nothing, which is how a chain with no such transfers behaves.
 */
function transfersByKind(byKind: Partial<Record<"router_collateral" | "outcome", TransferRow[]>>) {
  GetTransfers.mockImplementation((args: { where: { kind: { _eq: string } } }) =>
    Promise.resolve({ Transfer: byKind[args.where.kind._eq as keyof typeof byKind] ?? [] }),
  );
}

type StubOptions = {
  analytics?: { address: string; day: number }[];
  materialized?: string[];
  watermark?: { routerCollateralTs: number; outcomeTradeTs: number } | null;
};

/** Records what the run persisted, so the watermark assertions can read it back. */
// biome-ignore lint/suspicious/noExplicitAny: hand-rolled stand-in for the Supabase client
type Stub = { client: any; written: () => unknown };

/**
 * Minimal table-aware `supabase.from(...)` stand-in: the analytics and materialized halves page
 * through `range`, and the watermark round-trips through `key_value`.
 */
function supabaseStub(options: StubOptions = {}): Stub {
  let written: unknown;

  const client = {
    from(table: string) {
      const builder: Record<string, unknown> = {};
      for (const method of ["select", "eq", "in", "gte", "order"]) {
        builder[method] = () => builder;
      }
      builder.range = (from: number) => {
        if (from !== 0) return Promise.resolve({ data: [], error: null });
        if (table === "analytics_daily_wallet" || table === "analytics_daily_wallet_market") {
          return Promise.resolve({ data: options.analytics ?? [], error: null });
        }
        if (table === "pnl_leaderboard") {
          return Promise.resolve({ data: (options.materialized ?? []).map((address) => ({ address })), error: null });
        }
        return Promise.resolve({ data: [], error: null });
      };
      builder.maybeSingle = () =>
        Promise.resolve({ data: options.watermark ? { value: options.watermark } : null, error: null });
      builder.upsert = (row: { value: unknown }) => {
        written = row.value;
        return Promise.resolve({ error: null });
      };
      return builder;
    },
    // biome-ignore lint/suspicious/noExplicitAny: hand-rolled stand-in for the query builder
  } as any;

  return { client, written: () => written };
}

function addressesOf(candidates: { address: string }[]): string[] {
  return candidates.map((candidate) => candidate.address);
}

beforeEach(() => {
  GetTransfers.mockReset();
  GetTransfers.mockResolvedValue({ Transfer: [] });
  chainPoolAddressSet.mockReset();
  chainPoolAddressSet.mockResolvedValue(POOLS);
});

describe("listLeaderboardCandidates", () => {
  it("reaches a wallet that only ever traded through a relayer-driven executor", async () => {
    transfersByKind({ router_collateral: [routerCollateralRow(EXECUTOR, 10 * DAY + 500)] });

    const stub = supabaseStub({ analytics: [{ address: RELAYER, day: 9 * DAY }] });
    const candidates = await listLeaderboardCandidates(stub.client, CHAIN, undefined, { cutoffDay: 0 });

    const addresses = addressesOf(candidates);
    // The executor is the whole point: analytics only ever saw the relayer that signed for it.
    expect(addresses).toContain(EXECUTOR);
    expect(addresses).toContain(RELAYER);
    expect(addresses).not.toContain(OWNER);
    // Timestamps arrive in seconds and have to land on the same UTC-day grain as the analytics half.
    expect(candidates.find((c) => c.address === EXECUTOR)?.lastActivityDay).toBe(10 * DAY);
  });

  it("reaches a wallet that only ever swapped against a pool", async () => {
    // Never a router leg, and `tx_from` is the session key: this wallet is invisible to both of the
    // other sources, and is exactly the executor that only buys and sells outcome tokens.
    transfersByKind({ outcome: [outcomeRow(POOL, EXECUTOR, 11 * DAY + 10)] });

    const stub = supabaseStub({ analytics: [{ address: RELAYER, day: 9 * DAY }] });
    const candidates = await listLeaderboardCandidates(stub.client, CHAIN, undefined, { cutoffDay: 0 });

    expect(addressesOf(candidates)).toContain(EXECUTOR);
    expect(candidates.find((c) => c.address === EXECUTOR)?.lastActivityDay).toBe(11 * DAY);
  });

  it("never lists a pool, on either side of the transfer", async () => {
    transfersByKind({
      outcome: [outcomeRow(POOL, EXECUTOR, 11 * DAY), outcomeRow(EXECUTOR, POOL2, 11 * DAY + 1)],
    });

    const candidates = await listLeaderboardCandidates(supabaseStub().client, CHAIN, undefined, { cutoffDay: 0 });

    expect(addressesOf(candidates)).toEqual([EXECUTOR]);
  });

  it("ignores transfers that do not touch a pool, and hops between two pools", async () => {
    transfersByKind({
      outcome: [
        // An airdrop or an OTC transfer names nobody who traded.
        outcomeRow(OUTSIDER, OWNER, 11 * DAY),
        // A direct hop between pools would otherwise promote the unrecognized side.
        outcomeRow(POOL, POOL2, 11 * DAY + 1),
        outcomeRow(ZERO, POOL, 11 * DAY + 2),
      ],
    });

    const candidates = await listLeaderboardCandidates(supabaseStub().client, CHAIN, undefined, { cutoffDay: 0 });

    expect(candidates).toEqual([]);
  });

  it("does not scan outcome transfers at all when the pool set is empty", async () => {
    // An empty set has to disable the scan, not open it: with no pool to recognize, every transfer
    // would look like a trade against an unknown counterparty.
    chainPoolAddressSet.mockResolvedValue(new Set());
    transfersByKind({ outcome: [outcomeRow(POOL, EXECUTOR, 11 * DAY)] });

    const candidates = await listLeaderboardCandidates(supabaseStub().client, CHAIN, undefined, { cutoffDay: 0 });

    expect(candidates).toEqual([]);
    expect(GetTransfers.mock.calls.map((call) => call[0].where.kind._eq)).toEqual(["router_collateral"]);
  });

  it("keeps the latest activity day when both sources name the same wallet", async () => {
    transfersByKind({ router_collateral: [routerCollateralRow(RELAYER, 12 * DAY, false)] });

    const stub = supabaseStub({ analytics: [{ address: RELAYER, day: 9 * DAY }] });
    const candidates = await listLeaderboardCandidates(stub.client, CHAIN, undefined, { cutoffDay: 0 });

    expect(candidates).toHaveLength(1);
    expect(candidates[0].lastActivityDay).toBe(12 * DAY);
  });

  it("keeps refreshing wallets that already have a row", async () => {
    // The indexer scans are incremental, so a wallet they found on an earlier run is not in this
    // run's slice. Without the materialized half its row would freeze at the price of that day.
    const stub = supabaseStub({ materialized: [EXECUTOR] });
    const candidates = await listLeaderboardCandidates(stub.client, CHAIN, undefined, { cutoffDay: 0 });

    expect(candidates).toEqual([{ address: EXECUTOR, lastActivityDay: 0 }]);
  });

  it("still returns the other sources when the indexer scans fail", async () => {
    GetTransfers.mockRejectedValue(new Error("indexer down"));

    const stub = supabaseStub({ analytics: [{ address: RELAYER, day: 9 * DAY }] });
    const candidates = await listLeaderboardCandidates(stub.client, CHAIN, undefined, { cutoffDay: 0 });

    // Degrading to the old coverage beats blanking a board the analytics half could refresh.
    expect(addressesOf(candidates)).toEqual([RELAYER]);
  });

  it("asks the indexer for router collateral and pool trades only, never for every token holder", async () => {
    // The holder view (`AccountActivity`) would hand back every Uniswap pool on the chain, and a
    // pool's P/L is its inventory. Moving collateral with the router, or outcome tokens against a
    // pool, is what a pool never does.
    await listLeaderboardCandidates(supabaseStub().client, CHAIN, undefined, { cutoffDay: 3 * DAY });

    expect(GetTransfers).toHaveBeenCalledTimes(2);
    const wheres = GetTransfers.mock.calls.map((call) => call[0].where);
    expect(wheres).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: { _eq: "router_collateral" }, timestamp: { _gte: String(3 * DAY) } }),
        expect.objectContaining({ kind: { _eq: "outcome" }, timestamp: { _gte: String(3 * DAY) } }),
      ]),
    );
  });

  it("never lists the router itself or the zero address as a candidate", async () => {
    transfersByKind({
      router_collateral: [
        routerCollateralRow(EXECUTOR, 10 * DAY),
        transferRow("router_collateral", ZERO, ROUTER, 10 * DAY),
      ],
      outcome: [outcomeRow(POOL, ROUTER, 10 * DAY)],
    });

    const candidates = await listLeaderboardCandidates(supabaseStub().client, CHAIN, undefined, { cutoffDay: 0 });

    expect(addressesOf(candidates)).toEqual([EXECUTOR]);
  });

  it("resumes each scan from its watermark and advances it to the last transfer read", async () => {
    transfersByKind({
      router_collateral: [routerCollateralRow(EXECUTOR, 20 * DAY + 7)],
      outcome: [outcomeRow(POOL, EXECUTOR, 21 * DAY + 9)],
    });

    const stub = supabaseStub({ watermark: { routerCollateralTs: 5 * DAY, outcomeTradeTs: 6 * DAY } });
    await listLeaderboardCandidates(stub.client, CHAIN, undefined, { cutoffDay: 0 });

    const wheres = GetTransfers.mock.calls.map((call) => call[0].where);
    expect(wheres).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: { _eq: "router_collateral" }, timestamp: { _gte: String(5 * DAY) } }),
        expect.objectContaining({ kind: { _eq: "outcome" }, timestamp: { _gte: String(6 * DAY) } }),
      ]),
    );
    expect(stub.written()).toEqual({ routerCollateralTs: 20 * DAY + 7, outcomeTradeTs: 21 * DAY + 9 });
  });

  it("leaves the watermark alone when a scan fails, so the slice is read again", async () => {
    GetTransfers.mockRejectedValue(new Error("indexer down"));

    const stub = supabaseStub({ watermark: { routerCollateralTs: 5 * DAY, outcomeTradeTs: 6 * DAY } });
    await listLeaderboardCandidates(stub.client, CHAIN, undefined, { cutoffDay: 0 });

    expect(stub.written()).toBeUndefined();
  });

  it("scans from the given cutoff, ignoring the watermark, when not incremental", async () => {
    const stub = supabaseStub({ watermark: { routerCollateralTs: 5 * DAY, outcomeTradeTs: 6 * DAY } });
    await listLeaderboardCandidates(stub.client, CHAIN, undefined, { cutoffDay: 0, incremental: false });

    for (const call of GetTransfers.mock.calls) {
      expect(call[0].where.timestamp).toBeUndefined();
    }
    expect(stub.written()).toBeUndefined();
  });

  it("reports a scan that stopped at the page cap, so a coverage run knows its slice is partial", async () => {
    // The stub ignores `offset`, so handing back a full page every time is a stream that never
    // ends: the scan pages until the cap and stops. With `incremental: false` there is no watermark
    // to carry the remainder, so this is the truncation the callback exists to surface.
    const fullPage = Array.from({ length: PAGE }, (_, i) => routerCollateralRow(EXECUTOR, 10 * DAY + i));
    transfersByKind({ router_collateral: fullPage });

    const truncated: string[] = [];
    await listLeaderboardCandidates(supabaseStub().client, CHAIN, undefined, {
      cutoffDay: 0,
      incremental: false,
      onScanTruncated: (source) => truncated.push(source),
    });

    expect(truncated).toEqual(["router_collateral"]);
  });

  it("stays quiet when a scan reaches the end of the stream", async () => {
    transfersByKind({
      router_collateral: [routerCollateralRow(EXECUTOR, 10 * DAY)],
      outcome: [outcomeRow(POOL, EXECUTOR, 11 * DAY)],
    });

    const truncated: string[] = [];
    await listLeaderboardCandidates(supabaseStub().client, CHAIN, undefined, {
      cutoffDay: 0,
      incremental: false,
      onScanTruncated: (source) => truncated.push(source),
    });

    expect(truncated).toEqual([]);
  });

  it("leaves market-scoped jobs on the analytics source alone", async () => {
    const stub = supabaseStub({ analytics: [{ address: RELAYER, day: 9 * DAY }] });
    const candidates = await listLeaderboardCandidates(
      stub.client,
      CHAIN,
      ["0xaaaa000000000000000000000000000000000001"],
      {
        cutoffDay: 0,
      },
    );

    expect(addressesOf(candidates)).toEqual([RELAYER]);
    expect(GetTransfers).not.toHaveBeenCalled();
  });
});
