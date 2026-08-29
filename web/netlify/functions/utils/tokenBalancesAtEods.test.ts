import type { Address } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getTokenBalanceDailiesAtEods = vi.fn();

vi.mock("./envioClient", () => ({
  seerEnvioSdk: () => ({ GetTokenBalanceDailiesAtEods: getTokenBalanceDailiesAtEods }),
}));

import { fetchTokenBalancesAtEods, floorUtcDay } from "./seerIndexerPortfolio";

const ACCOUNT = "0xAbCdEf0000000000000000000000000000000001" as Address;
const CHAIN = 100;
const T1 = "0x1111111111111111111111111111111111111111";
const T2 = "0x2222222222222222222222222222222222222222";
const T3 = "0x3333333333333333333333333333333333333333";

const DAY = 86_400;
const EOD_1D = 1_800_000_000;
const EOD_1W = EOD_1D - 6 * DAY;

function row(token: string, dayStart: number, balance: string) {
  return { token, dayStartTimestamp: String(dayStart), balance };
}

function page(slots: Array<ReturnType<typeof row>[]>) {
  return { eod0: slots[0] ?? [], eod1: slots[1] ?? [], eod2: slots[2] ?? [], eod3: slots[3] ?? [] };
}

beforeEach(() => {
  getTokenBalanceDailiesAtEods.mockReset();
});

describe("fetchTokenBalancesAtEods", () => {
  it("resolves each day boundary from its own alias slot in one round trip", async () => {
    getTokenBalanceDailiesAtEods.mockResolvedValueOnce(
      page([[row(T1, EOD_1D, "500"), row(T2, EOD_1D, "700")], [row(T1, EOD_1W, "100")]]),
    );

    const out = await fetchTokenBalancesAtEods(ACCOUNT, CHAIN as never, [EOD_1D, EOD_1W], [T1, T2] as Address[]);

    expect(getTokenBalanceDailiesAtEods).toHaveBeenCalledTimes(1);
    expect(out.get(EOD_1D)).toEqual(
      new Map([
        [T1, 500n],
        [T2, 700n],
      ]),
    );
    expect(out.get(EOD_1W)).toEqual(new Map([[T1, 100n]]));
  });

  it("bounds each slot at the floored UTC day and lowercases the account", async () => {
    getTokenBalanceDailiesAtEods.mockResolvedValueOnce(page([[], []]));

    await fetchTokenBalancesAtEods(ACCOUNT, CHAIN as never, [EOD_1D, EOD_1W], [T1] as Address[]);

    const vars = getTokenBalanceDailiesAtEods.mock.calls[0][0];
    expect(vars.where0).toEqual({
      chainId: { _eq: "100" },
      account: { _eq: ACCOUNT.toLowerCase() },
      dayStartTimestamp: { _lte: String(floorUtcDay(EOD_1D)) },
    });
    expect(vars.where1.dayStartTimestamp).toEqual({ _lte: String(floorUtcDay(EOD_1W)) });
    // Unused slots must match nothing rather than scan the whole table.
    expect(vars.where2).toEqual({ id: { _eq: "" } });
    expect(vars.where3).toEqual({ id: { _eq: "" } });
  });

  it("drops tokens outside the requested set", async () => {
    getTokenBalanceDailiesAtEods.mockResolvedValueOnce(page([[row(T1, EOD_1D, "5"), row(T3, EOD_1D, "9")]]));

    const out = await fetchTokenBalancesAtEods(ACCOUNT, CHAIN as never, [EOD_1D], [T1] as Address[]);

    expect(out.get(EOD_1D)).toEqual(new Map([[T1, 5n]]));
  });

  it("keeps paginating a full slot and retires the slot that returned a short page", async () => {
    const full = Array.from({ length: 1000 }, (_, i) =>
      row(`0x${(i + 1).toString(16).padStart(40, "0")}`, EOD_1D, "1"),
    );
    getTokenBalanceDailiesAtEods
      .mockResolvedValueOnce(page([full, [row(T1, EOD_1W, "42")]]))
      .mockResolvedValueOnce(page([[row(T2, EOD_1D, "8")]]));

    const out = await fetchTokenBalancesAtEods(ACCOUNT, CHAIN as never, [EOD_1D, EOD_1W], [T1, T2] as Address[]);

    expect(getTokenBalanceDailiesAtEods).toHaveBeenCalledTimes(2);
    const second = getTokenBalanceDailiesAtEods.mock.calls[1][0];
    expect(second.offset).toBe(1000);
    // Slot 1 completed on the first page, so it must not be queried again.
    expect(second.where1).toEqual({ id: { _eq: "" } });
    expect(out.get(EOD_1D)).toEqual(new Map([[T2, 8n]]));
    expect(out.get(EOD_1W)).toEqual(new Map([[T1, 42n]]));
  });

  it("chunks more than four boundaries into separate round trips", async () => {
    getTokenBalanceDailiesAtEods.mockResolvedValueOnce(page([[], [], [], []])).mockResolvedValueOnce(page([[]]));

    const eods = [EOD_1D, EOD_1D - DAY, EOD_1D - 2 * DAY, EOD_1D - 3 * DAY, EOD_1D - 4 * DAY];
    await fetchTokenBalancesAtEods(ACCOUNT, CHAIN as never, eods, [T1] as Address[]);

    expect(getTokenBalanceDailiesAtEods).toHaveBeenCalledTimes(2);
    expect(getTokenBalanceDailiesAtEods.mock.calls[1][0].where1).toEqual({ id: { _eq: "" } });
  });

  it("short-circuits without a request when there are no tokens", async () => {
    const out = await fetchTokenBalancesAtEods(ACCOUNT, CHAIN as never, [EOD_1D], []);

    expect(getTokenBalanceDailiesAtEods).not.toHaveBeenCalled();
    expect(out.get(EOD_1D)).toEqual(new Map());
  });
});
