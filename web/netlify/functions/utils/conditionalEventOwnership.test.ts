import type { Address } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";

const GetTransfers = vi.fn();
const GetConditionalEvents = vi.fn();

vi.mock("./envioClient", () => ({
  seerEnvioSdk: () => ({ GetTransfers, GetConditionalEvents }),
}));

import { fetchConditionalEventsByTransactions, fetchRouterCollateralTransactionHashes } from "./seerIndexerPortfolio";

const EXECUTOR = "0x2771980e5252204e526745acf056d4a6e2299df0" as Address;
const ROUTER = "0x179d8f8c811b8c759c33809dbc6c5cedc62d05dd";
const RELAYER = "0xda6ada37d7e0c697e1bd18ca0586e342b1c45496";
const PRIMARY = {
  address: "0xb5b2dc7fd34c249f4be7fb1fcea07950784229e0" as Address,
  decimals: 18,
  symbol: "sUSDS",
  name: "sUSDS",
} as never;
const TX_A = "0xe303e6cd0b7fad5e3c30e2e202e1c30c78288b96c89cceafb87414bd712dc836";
const TX_B = "0xbd0bf63c6a8447cb8f0b3bd92e9a80ff208b614ae787ddfe1a6082fae08b1504";

beforeEach(() => {
  GetTransfers.mockReset();
  GetConditionalEvents.mockReset();
});

function transfer(txHash: string, from: string, to: string) {
  return { transactionHash: txHash, from, to, value: "750000000000000000000", timestamp: "1000" };
}

function conditionalEvent(txHash: string, marketAddress: string) {
  return {
    id: `10:${txHash}-240-10:${marketAddress}`,
    market: { id: `10:${marketAddress}`, address: marketAddress, marketName: "m" },
    eventType: "split",
    amount: "750000000000000000000",
    collateral: PRIMARY.address,
    timestamp: "1000",
    blockNumber: "1",
    transactionHash: txHash,
  };
}

describe("fetchRouterCollateralTransactionHashes", () => {
  it("returns the transactions where collateral moved, deduplicated", async () => {
    GetTransfers.mockResolvedValueOnce({
      Transfer: [transfer(TX_A, EXECUTOR, ROUTER), transfer(TX_A, EXECUTOR, ROUTER), transfer(TX_B, ROUTER, EXECUTOR)],
    });

    const hashes = await fetchRouterCollateralTransactionHashes(EXECUTOR, 10 as never, PRIMARY, 2_000);

    expect(hashes).toEqual([TX_A, TX_B]);
  });

  it("returns nothing when no collateral ever moved", async () => {
    GetTransfers.mockResolvedValueOnce({ Transfer: [] });
    expect(await fetchRouterCollateralTransactionHashes(EXECUTOR, 10 as never, PRIMARY, 2_000)).toEqual([]);
  });
});

describe("fetchConditionalEventsByTransactions", () => {
  it("finds legs booked to a relayer, which the accountId filter would miss", async () => {
    GetConditionalEvents.mockResolvedValueOnce({
      ConditionalEvent: [conditionalEvent(TX_A, "0xaaaa000000000000000000000000000000000001")],
    });

    const events = await fetchConditionalEventsByTransactions(10 as never, [TX_A]);

    // The query keys off the transaction, never off an account — that is the whole point.
    const where = GetConditionalEvents.mock.calls[0][0].where;
    expect(where.transactionHash).toEqual({ _in: [TX_A] });
    expect(where.accountId).toBeUndefined();
    expect(events).toHaveLength(1);
    expect(events[0].amount).toBe(750n * 10n ** 18n);
    expect(events[0].marketId).toBe("0xaaaa000000000000000000000000000000000001");
  });

  it("short-circuits without a request when there are no transactions", async () => {
    expect(await fetchConditionalEventsByTransactions(10 as never, [])).toEqual([]);
    expect(GetConditionalEvents).not.toHaveBeenCalled();
  });

  it("lowercases and dedupes the transaction filter", async () => {
    GetConditionalEvents.mockResolvedValueOnce({ ConditionalEvent: [] });
    await fetchConditionalEventsByTransactions(10 as never, [TX_A.toUpperCase(), TX_A]);
    expect(GetConditionalEvents.mock.calls[0][0].where.transactionHash).toEqual({ _in: [TX_A] });
  });

  it("applies the window bounds when given", async () => {
    GetConditionalEvents.mockResolvedValueOnce({ ConditionalEvent: [] });
    await fetchConditionalEventsByTransactions(10 as never, [TX_A], { startTime: 100, endTime: 900 });
    expect(GetConditionalEvents.mock.calls[0][0].where.timestamp).toEqual({ _gt: "100", _lte: "900" });
  });

  it("skips rows the indexer could not attach to a market", async () => {
    GetConditionalEvents.mockResolvedValueOnce({
      ConditionalEvent: [{ ...conditionalEvent(TX_A, "0xa"), market: null }],
    });
    expect(await fetchConditionalEventsByTransactions(10 as never, [TX_A])).toEqual([]);
  });
});
