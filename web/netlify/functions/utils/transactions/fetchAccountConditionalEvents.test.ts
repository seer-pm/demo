import type { Token } from "@seer-pm/sdk";
import type { Address } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";

const GetTransfers = vi.fn();
const GetConditionalEvents = vi.fn();

vi.mock("../envioClient", () => ({
  seerEnvioSdk: () => ({ GetTransfers, GetConditionalEvents }),
}));

import { fetchAccountConditionalTransactions } from "./fetchAccountConditionalEvents";

const EXECUTOR = "0x2771980e5252204e526745acf056d4a6e2299df0" as Address;
const ROUTER = "0x179d8f8c811b8c759c33809dbc6c5cedc62d05dd";
const PRIMARY = {
  address: "0xb5b2dc7fd34c249f4be7fb1fcea07950784229e0" as Address,
  chainId: 10,
  decimals: 18,
  symbol: "sUSDS",
  name: "sUSDS",
} as Token;
const TX_A = "0xe303e6cd0b7fad5e3c30e2e202e1c30c78288b96c89cceafb87414bd712dc836";
const MARKET_A = "0xaaaa000000000000000000000000000000000001";
const MARKET_B = "0xaaaa000000000000000000000000000000000002";

beforeEach(() => {
  GetTransfers.mockReset();
  GetConditionalEvents.mockReset();
});

/** One CTF event as the indexer fans it out: same leg, one row per market sharing the condition. */
function fannedOutLeg(eventType: string, marketAddress: string) {
  return {
    id: `10:${TX_A}-240-10:${marketAddress}`,
    market: { id: `10:${marketAddress}`, address: marketAddress, marketName: "m" },
    eventType,
    amount: "750000000000000000000",
    collateral: PRIMARY.address,
    timestamp: "1000",
    blockNumber: "1",
    transactionHash: TX_A,
  };
}

describe("fetchAccountConditionalTransactions", () => {
  it("renders a fanned-out redeem as one row, not one per duplicate market", async () => {
    GetConditionalEvents.mockResolvedValueOnce({
      ConditionalEvent: [fannedOutLeg("redeem", MARKET_A), fannedOutLeg("redeem", MARKET_B)],
    });
    GetTransfers.mockResolvedValueOnce({ Transfer: [] });

    const rows = await fetchAccountConditionalTransactions(EXECUTOR, 10 as never, PRIMARY, [MARKET_B]);

    expect(rows).toHaveLength(1);
    // The endpoint dedupes by `eventId`, and the fan-out ids differ — so the collapse has to happen
    // here or the same redeem renders twice.
    expect(rows[0].marketId).toBe(MARKET_B);
    expect(rows[0].type).toBe("redeem");
    expect(rows[0].payout).toBe("750000000000000000000");
  });

  it("surfaces a leg the relayer was booked as, found through the router transfer", async () => {
    GetConditionalEvents.mockResolvedValueOnce({ ConditionalEvent: [] });
    GetTransfers.mockResolvedValueOnce({
      Transfer: [{ transactionHash: TX_A, from: EXECUTOR, to: ROUTER, value: "1", timestamp: "1000" }],
    });
    GetConditionalEvents.mockResolvedValueOnce({ ConditionalEvent: [fannedOutLeg("split", MARKET_A)] });

    const rows = await fetchAccountConditionalTransactions(EXECUTOR, 10 as never, PRIMARY);

    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe("split");
    expect(rows[0].amount).toBe("750000000000000000000");
  });

  it("stays on the accountId read when the chain has no primary collateral", async () => {
    GetConditionalEvents.mockResolvedValueOnce({ ConditionalEvent: [fannedOutLeg("merge", MARKET_A)] });

    const rows = await fetchAccountConditionalTransactions(EXECUTOR, 10 as never, undefined);

    expect(rows).toHaveLength(1);
    // No collateral to follow means no router scan at all, rather than an empty result.
    expect(GetTransfers).not.toHaveBeenCalled();
    expect(GetConditionalEvents.mock.calls[0][0].where.accountId).toEqual({ _eq: EXECUTOR });
  });
});
