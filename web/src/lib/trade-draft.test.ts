import { describe, expect, it } from "vitest";
import {
  type TradeDrafts,
  applyTradeDraft,
  clearTradeDraftSection,
  getTradeDraftKey,
  isDraftForOutcome,
  readOrderType,
} from "./trade-draft";

const KEY = getTradeDraftKey(100, "0xABC");
const OUTCOME = "0x1111111111111111111111111111111111111111";

describe("getTradeDraftKey", () => {
  it("is case insensitive on the market id", () => {
    expect(getTradeDraftKey(100, "0xABC")).toBe(getTradeDraftKey(100, "0xabc"));
  });

  it("keeps drafts of the same market on different chains apart", () => {
    expect(getTradeDraftKey(100, "0xabc")).not.toBe(getTradeDraftKey(1, "0xabc"));
  });
});

describe("applyTradeDraft", () => {
  it("merges section by section, leaving the other sections alone", () => {
    let drafts: TradeDrafts = {};
    drafts = applyTradeDraft(drafts, KEY, { orderType: "limit" });
    drafts = applyTradeDraft(drafts, KEY, { limit: { outcomeToken: OUTCOME, limitPrice: "0.86" } });

    expect(drafts[KEY]).toEqual({ orderType: "limit", limit: { outcomeToken: OUTCOME, limitPrice: "0.86" } });
  });

  it("replaces a section wholesale rather than deep merging it", () => {
    let drafts = applyTradeDraft({}, KEY, { fillToEstimate: { targetEstimate: "120", maxCollateralToUse: "50" } });
    drafts = applyTradeDraft(drafts, KEY, { fillToEstimate: { targetEstimate: "130", maxCollateralToUse: "" } });

    expect(drafts[KEY].fillToEstimate).toEqual({ targetEstimate: "130", maxCollateralToUse: "" });
  });

  it("does not mutate the drafts it is given", () => {
    const drafts: TradeDrafts = { [KEY]: { orderType: "market" } };
    applyTradeDraft(drafts, KEY, { orderType: "limit" });

    expect(drafts[KEY].orderType).toBe("market");
  });

  it("drops the least recently written markets past the cap", () => {
    let drafts: TradeDrafts = {};
    for (const marketId of ["0x1", "0x2", "0x3"]) {
      drafts = applyTradeDraft(drafts, getTradeDraftKey(100, marketId), { orderType: "market" }, 2);
    }

    expect(Object.keys(drafts)).toEqual([getTradeDraftKey(100, "0x2"), getTradeDraftKey(100, "0x3")]);
  });

  it("counts a rewritten market as the most recent one", () => {
    let drafts: TradeDrafts = {};
    for (const marketId of ["0x1", "0x2"]) {
      drafts = applyTradeDraft(drafts, getTradeDraftKey(100, marketId), { orderType: "market" }, 2);
    }
    drafts = applyTradeDraft(drafts, getTradeDraftKey(100, "0x1"), { orderType: "limit" }, 2);
    drafts = applyTradeDraft(drafts, getTradeDraftKey(100, "0x3"), { orderType: "market" }, 2);

    expect(Object.keys(drafts)).toEqual([getTradeDraftKey(100, "0x1"), getTradeDraftKey(100, "0x3")]);
  });
});

describe("clearTradeDraftSection", () => {
  it("drops only that section and keeps the order type", () => {
    const drafts: TradeDrafts = {
      [KEY]: {
        orderType: "limit",
        limit: { outcomeToken: OUTCOME, limitPrice: "0.5" },
        fillToEstimate: { targetEstimate: "10", maxCollateralToUse: "1" },
      },
    };

    expect(clearTradeDraftSection(drafts, KEY, "limit")).toEqual({
      [KEY]: { orderType: "limit", fillToEstimate: { targetEstimate: "10", maxCollateralToUse: "1" } },
    });
  });

  it("returns the same object when there is nothing to remove", () => {
    const drafts: TradeDrafts = { [KEY]: { orderType: "limit" } };

    expect(clearTradeDraftSection(drafts, KEY, "market")).toBe(drafts);
    expect(clearTradeDraftSection(drafts, "missing", "market")).toBe(drafts);
  });
});

describe("isDraftForOutcome", () => {
  it("matches the outcome the draft was typed against, whatever the casing", () => {
    expect(isDraftForOutcome({ outcomeToken: OUTCOME.toUpperCase() }, OUTCOME)).toBe(true);
  });

  it("rejects a draft from another outcome, and a missing draft", () => {
    expect(isDraftForOutcome({ outcomeToken: OUTCOME }, "0x2222222222222222222222222222222222222222")).toBe(false);
    expect(isDraftForOutcome(undefined, OUTCOME)).toBe(false);
  });
});

describe("readOrderType", () => {
  it("defaults to market without a stored draft", () => {
    expect(readOrderType(undefined, { isGeneric: true, allowFillToEstimate: true })).toBe("market");
  });

  it("returns the stored order type when the market still offers it", () => {
    expect(readOrderType("limit", { isGeneric: true, allowFillToEstimate: false })).toBe("limit");
    expect(readOrderType("fill-to-estimate", { isGeneric: true, allowFillToEstimate: true })).toBe("fill-to-estimate");
  });

  it("falls back to market on non-Generic markets, which are market-order only", () => {
    expect(readOrderType("limit", { isGeneric: false, allowFillToEstimate: true })).toBe("market");
  });

  it("falls back to market when fill-to-estimate is not available here", () => {
    expect(readOrderType("fill-to-estimate", { isGeneric: true, allowFillToEstimate: false })).toBe("market");
  });
});
