import { describe, expect, it } from "vitest";
import {
  type MtmRefreshRow,
  effectivePricesByToken,
  markToMarket,
  refreshMarketMtm,
  refreshRowMtm,
} from "./marketMtmRefresh";

const WALLET = "0xaaaa000000000000000000000000000000000001";
const MARKET = "0xbbbb000000000000000000000000000000000002";
const YES = "0x1111000000000000000000000000000000000001";
const NO = "0x1111000000000000000000000000000000000002";

function row(over: Partial<MtmRefreshRow> = {}): MtmRefreshRow {
  return {
    address: WALLET,
    marketId: MARKET,
    period: "all",
    valueStartMtm: 0,
    routerPrimaryCumStart: 0,
    routerPrimaryCumEnd: 0,
    tradingCollateralNetOut: 0,
    lpCollateralNetOut: 0,
    ...over,
  };
}

const key = (address = WALLET, marketId = MARKET, period = "all") =>
  `${address.toLowerCase()}|${marketId.toLowerCase()}|${period}`;

describe("markToMarket", () => {
  it("values holdings at the market's prices", () => {
    expect(
      markToMarket(
        new Map([
          [YES, 10],
          [NO, 4],
        ]),
        { [YES]: 0.6, [NO]: 0.4 },
      ),
    ).toBeCloseTo(7.6, 10);
  });

  it("treats a token with no price as worth zero rather than skipping it", () => {
    expect(markToMarket(new Map([[YES, 10]]), {})).toBe(0);
  });

  it("matches prices case-insensitively", () => {
    expect(markToMarket(new Map([[YES.toUpperCase(), 2]]), { [YES]: 0.5 })).toBeCloseTo(1, 10);
  });
});

describe("effectivePricesByToken", () => {
  it("prefers the settled payout over the pool price", () => {
    const p = effectivePricesByToken({
      tokens: [YES, NO],
      redeemedByToken: { [YES]: 1, [NO]: 0 },
      currentByToken: { [YES]: 0.7, [NO]: 0.3 },
    });
    expect(p[YES]).toBe(1);
  });

  it("falls back to the pool price while the market is unresolved", () => {
    const p = effectivePricesByToken({
      tokens: [YES],
      redeemedByToken: { [YES]: 0 },
      currentByToken: { [YES]: 0.62 },
    });
    expect(p[YES]).toBeCloseTo(0.62, 10);
  });

  it("keeps a winning outcome priced when a resolved market has no pool left", () => {
    // The case that zeroed real positions: no on-chain price, but the payout is 1.
    const p = effectivePricesByToken({ tokens: [YES], redeemedByToken: { [YES]: 1 }, currentByToken: {} });
    expect(p[YES]).toBe(1);
  });

  it("prices a losing outcome of a resolved market at zero", () => {
    const p = effectivePricesByToken({ tokens: [NO], redeemedByToken: { [NO]: 0 }, currentByToken: {} });
    expect(p[NO]).toBe(0);
  });
});

describe("refreshRowMtm", () => {
  it("rebuilds pnl from stored cashflow, changing only the MTM half", () => {
    // Bought for 8 (trading net out), position now worth 10.
    const update = refreshRowMtm({
      row: row({ tradingCollateralNetOut: 8 }),
      valueEndMtm: 10,
      collateralPriceUsd: 2,
    });
    expect(update.valueEnd).toBeCloseTo(10, 10);
    expect(update.pnl).toBeCloseTo(2, 10);
    expect(update.pnlUsd).toBeCloseTo(4, 10);
  });

  it("carries the router cumulative into value_end", () => {
    const update = refreshRowMtm({
      row: row({ routerPrimaryCumEnd: -30, tradingCollateralNetOut: 0 }),
      valueEndMtm: 42,
      collateralPriceUsd: 1,
    });
    expect(update.valueEnd).toBeCloseTo(12, 10);
    expect(update.pnl).toBeCloseTo(12, 10);
  });

  it("keeps the window's opening value out of the delta", () => {
    // Held 5 at the window start, now worth 9: the period gained 4, not 9.
    const update = refreshRowMtm({
      row: row({ valueStartMtm: 5 }),
      valueEndMtm: 9,
      collateralPriceUsd: 1,
    });
    expect(update.pnl).toBeCloseTo(4, 10);
  });
});

describe("refreshMarketMtm", () => {
  const holdings = new Map([[WALLET, new Map([[YES, 10]])]]);
  const prices = { [YES]: 0.9 };

  it("emits an update when the market moved", () => {
    const out = refreshMarketMtm({
      rows: [row()],
      currentValueEndMtm: new Map([[key(), 5]]),
      holdings,
      pricesByToken: prices,
      collateralPriceUsd: 1,
    });
    expect(out).toHaveLength(1);
    expect(out[0].valueEndMtm).toBeCloseTo(9, 10);
  });

  it("skips rows whose value did not move, so updated_at does not churn", () => {
    const out = refreshMarketMtm({
      rows: [row()],
      currentValueEndMtm: new Map([[key(), 9]]),
      holdings,
      pricesByToken: prices,
      collateralPriceUsd: 1,
    });
    expect(out).toEqual([]);
  });

  it("values a wallet that fully exited at zero instead of leaving the old number", () => {
    const out = refreshMarketMtm({
      rows: [row()],
      currentValueEndMtm: new Map([[key(), 9]]),
      holdings: new Map(),
      pricesByToken: prices,
      collateralPriceUsd: 1,
    });
    expect(out).toHaveLength(1);
    expect(out[0].valueEndMtm).toBe(0);
  });

  it("updates every period of the same wallet independently", () => {
    const out = refreshMarketMtm({
      rows: [row({ period: "1d", valueStartMtm: 8 }), row({ period: "all", valueStartMtm: 0 })],
      currentValueEndMtm: new Map([
        [key(WALLET, MARKET, "1d"), 0],
        [key(WALLET, MARKET, "all"), 0],
      ]),
      holdings,
      pricesByToken: prices,
      collateralPriceUsd: 1,
    });
    expect(out.map((u) => u.period)).toEqual(["1d", "all"]);
    expect(out.find((u) => u.period === "1d")!.pnl).toBeCloseTo(1, 10);
    expect(out.find((u) => u.period === "all")!.pnl).toBeCloseTo(9, 10);
  });
});
