import type { Token } from "@seer-pm/sdk";
import type { Address } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";

const GetTransfers = vi.fn();
const GetConditionalEvents = vi.fn();

vi.mock("./envioClient", () => ({
  seerEnvioSdk: () => ({ GetTransfers, GetConditionalEvents }),
}));

import {
  conditionalEventStakeholderIsForeign,
  fetchConditionalEventsByTransactions,
  fetchConditionalEventsForAccountWidened,
  fetchRouterCollateralTransactionHashes,
} from "./seerIndexerPortfolio";

const EXECUTOR = "0x2771980e5252204e526745acf056d4a6e2299df0" as Address;
// The deployed optimism router: the stakeholder guard resolves it through `getRouterAddresses(10)`,
// so this has to be the real address and not a placeholder.
const ROUTER = "0x179d8f8c811b8c759c33809dbc6c5cedc62d05dd";
const OTHER_WALLET = "0x9c8f2c1d2b6d4e0a5f3a7b8c9d0e1f2a3b4c5d6e";
const RELAYER = "0xda6ada37d7e0c697e1bd18ca0586e342b1c45496";
const PRIMARY = {
  address: "0xb5b2dc7fd34c249f4be7fb1fcea07950784229e0" as Address,
  chainId: 10,
  decimals: 18,
  symbol: "sUSDS",
  name: "sUSDS",
} as Token;
const TX_A = "0xe303e6cd0b7fad5e3c30e2e202e1c30c78288b96c89cceafb87414bd712dc836";
const TX_B = "0xbd0bf63c6a8447cb8f0b3bd92e9a80ff208b614ae787ddfe1a6082fae08b1504";

beforeEach(() => {
  GetTransfers.mockReset();
  GetConditionalEvents.mockReset();
});

function transfer(txHash: string, from: string, to: string) {
  return { transactionHash: txHash, from, to, value: "750000000000000000000", timestamp: "1000" };
}

function conditionalEvent(
  txHash: string,
  marketAddress: string,
  stakeholder = ROUTER,
  amount = "750000000000000000000",
) {
  return {
    id: `10:${txHash}-240-10:${marketAddress}`,
    market: { id: `10:${marketAddress}`, address: marketAddress, marketName: "m" },
    eventType: "split",
    stakeholder,
    amount,
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

describe("fetchConditionalEventsForAccountWidened", () => {
  it("keeps a leg booked to the relayer, which the accountId filter alone drops", async () => {
    // What the executor's own `accountId` query returns: nothing. `resolveAccountId` booked the
    // event to the EOA that signed for the relayer.
    GetConditionalEvents.mockResolvedValueOnce({ ConditionalEvent: [] });
    GetTransfers.mockResolvedValueOnce({ Transfer: [transfer(TX_A, EXECUTOR, ROUTER)] });
    GetConditionalEvents.mockResolvedValueOnce({
      ConditionalEvent: [
        { ...conditionalEvent(TX_A, "0xaaaa000000000000000000000000000000000001"), accountId: RELAYER },
      ],
    });

    const events = await fetchConditionalEventsForAccountWidened(EXECUTOR, 10 as never, PRIMARY);

    expect(events).toHaveLength(1);
    expect(events[0].transactionHash).toBe(TX_A);
    expect(events[0].amount).toBe(750n * 10n ** 18n);
  });

  it("counts a leg both signals find exactly once", async () => {
    const shared = conditionalEvent(TX_A, "0xaaaa000000000000000000000000000000000001");
    GetConditionalEvents.mockResolvedValueOnce({ ConditionalEvent: [shared] });
    GetTransfers.mockResolvedValueOnce({ Transfer: [transfer(TX_A, EXECUTOR, ROUTER)] });
    GetConditionalEvents.mockResolvedValueOnce({ ConditionalEvent: [shared] });

    const events = await fetchConditionalEventsForAccountWidened(EXECUTOR, 10 as never, PRIMARY);

    expect(events).toHaveLength(1);
    expect(events[0].id).toBe(shared.id);
  });

  it("still returns the accountId legs when no collateral ever moved through a router", async () => {
    GetConditionalEvents.mockResolvedValueOnce({
      ConditionalEvent: [conditionalEvent(TX_B, "0xaaaa000000000000000000000000000000000002")],
    });
    GetTransfers.mockResolvedValueOnce({ Transfer: [] });

    const events = await fetchConditionalEventsForAccountWidened(EXECUTOR, 10 as never, PRIMARY);

    expect(events).toHaveLength(1);
    expect(events[0].transactionHash).toBe(TX_B);
    // No transactions to ask about, so the second query is never issued.
    expect(GetConditionalEvents).toHaveBeenCalledTimes(1);
  });

  it("drops a leg the CTF booked to another wallet, keeping this wallet's own leg from the same transaction", async () => {
    // Two distinct legs in one transaction: this wallet's, mediated by the router, and another
    // wallet's, called straight on the CTF. The transaction filter sweeps in both.
    GetConditionalEvents.mockResolvedValueOnce({ ConditionalEvent: [] });
    GetTransfers.mockResolvedValueOnce({ Transfer: [transfer(TX_A, EXECUTOR, ROUTER)] });
    GetConditionalEvents.mockResolvedValueOnce({
      ConditionalEvent: [
        conditionalEvent(TX_A, "0xaaaa000000000000000000000000000000000001"),
        conditionalEvent(TX_A, "0xaaaa000000000000000000000000000000000002", OTHER_WALLET, "400000000000000000000"),
      ],
    });

    const events = await fetchConditionalEventsForAccountWidened(EXECUTOR, 10 as never, PRIMARY);

    expect(events).toHaveLength(1);
    expect(events[0].marketId).toBe("0xaaaa000000000000000000000000000000000001");
    expect(events[0].amount).toBe(750n * 10n ** 18n);
  });

  it("keeps both legs of a transaction when both went through the router", async () => {
    // What makes reading the transaction whole correct: a TradeExecutor's owner is immutable and it
    // acts only for that owner — whoever signs, owner or session key — and an EOA transaction targets
    // one executor, so a router transaction carries one wallet's operation. The CTF books the router
    // as the stakeholder for every router-mediated leg, so the guard cannot separate two wallets
    // here — this test is where that would show if the invariant ever stopped holding.
    GetConditionalEvents.mockResolvedValueOnce({ ConditionalEvent: [] });
    GetTransfers.mockResolvedValueOnce({ Transfer: [transfer(TX_A, EXECUTOR, ROUTER)] });
    GetConditionalEvents.mockResolvedValueOnce({
      ConditionalEvent: [
        conditionalEvent(TX_A, "0xaaaa000000000000000000000000000000000001"),
        conditionalEvent(TX_A, "0xaaaa000000000000000000000000000000000002", ROUTER, "400000000000000000000"),
      ],
    });

    const events = await fetchConditionalEventsForAccountWidened(EXECUTOR, 10 as never, PRIMARY);

    expect(events.map((e) => e.amount)).toEqual([750n * 10n ** 18n, 400n * 10n ** 18n]);
  });

  it("keeps a leg the wallet booked on the CTF itself, without a router", async () => {
    GetConditionalEvents.mockResolvedValueOnce({ ConditionalEvent: [] });
    GetTransfers.mockResolvedValueOnce({ Transfer: [transfer(TX_A, EXECUTOR, ROUTER)] });
    GetConditionalEvents.mockResolvedValueOnce({
      ConditionalEvent: [conditionalEvent(TX_A, "0xaaaa000000000000000000000000000000000001", EXECUTOR)],
    });

    const events = await fetchConditionalEventsForAccountWidened(EXECUTOR, 10 as never, PRIMARY);

    expect(events).toHaveLength(1);
  });

  it("never applies the stakeholder guard to the accountId half", async () => {
    // `accountId` is the indexer's own attribution; a foreign stakeholder there is the router case
    // the union exists to keep, not evidence against ownership.
    GetConditionalEvents.mockResolvedValueOnce({
      ConditionalEvent: [conditionalEvent(TX_B, "0xaaaa000000000000000000000000000000000002", OTHER_WALLET)],
    });
    GetTransfers.mockResolvedValueOnce({ Transfer: [] });

    const events = await fetchConditionalEventsForAccountWidened(EXECUTOR, 10 as never, PRIMARY);

    expect(events).toHaveLength(1);
    expect(events[0].transactionHash).toBe(TX_B);
  });

  it("passes the same window to both halves of the union", async () => {
    GetConditionalEvents.mockResolvedValueOnce({ ConditionalEvent: [] });
    GetTransfers.mockResolvedValueOnce({ Transfer: [transfer(TX_A, EXECUTOR, ROUTER)] });
    GetConditionalEvents.mockResolvedValueOnce({ ConditionalEvent: [] });

    await fetchConditionalEventsForAccountWidened(EXECUTOR, 10 as never, PRIMARY, {
      startTime: 100,
      endTime: 900,
    });

    const window = { _gt: "100", _lte: "900" };
    expect(GetConditionalEvents.mock.calls[0][0].where.timestamp).toEqual(window);
    expect(GetConditionalEvents.mock.calls[1][0].where.timestamp).toEqual(window);
    // The router scan is cumulative to `endTime`: a split before the window can be what the redeem
    // inside it settles, and the transaction list is only used to test ownership.
    expect(GetTransfers.mock.calls[0][0].where.timestamp).toEqual({ _lte: "900" });
  });
});

describe("conditionalEventStakeholderIsForeign", () => {
  it("keeps a router-mediated leg — the case the transfer signal resolves", () => {
    expect(conditionalEventStakeholderIsForeign({ stakeholder: ROUTER }, EXECUTOR, 10 as never)).toBe(false);
  });

  it("keeps a leg the wallet booked itself, whatever the casing", () => {
    expect(conditionalEventStakeholderIsForeign({ stakeholder: EXECUTOR.toUpperCase() }, EXECUTOR, 10 as never)).toBe(
      false,
    );
  });

  it("rejects a leg booked to another wallet", () => {
    expect(conditionalEventStakeholderIsForeign({ stakeholder: OTHER_WALLET }, EXECUTOR, 10 as never)).toBe(true);
  });

  it("fails open on an empty or zero stakeholder", () => {
    expect(conditionalEventStakeholderIsForeign({ stakeholder: "" }, EXECUTOR, 10 as never)).toBe(false);
    expect(
      conditionalEventStakeholderIsForeign(
        { stakeholder: "0x0000000000000000000000000000000000000000" },
        EXECUTOR,
        10 as never,
      ),
    ).toBe(false);
  });
});
