import { describe, expect, it } from "vitest";
import { conditionalEventMarketFilters } from "./seerIndexerPortfolio";

describe("conditionalEventMarketFilters", () => {
  it("returns an empty filter when unscoped", () => {
    expect(conditionalEventMarketFilters()).toEqual([{}]);
  });

  it("uses _eq for a single market", () => {
    expect(conditionalEventMarketFilters("0xAA")).toEqual([{ market: { address: { _eq: "0xaa" } } }]);
    expect(conditionalEventMarketFilters(undefined, ["0xAA"])).toEqual([{ market: { address: { _eq: "0xaa" } } }]);
  });

  it("uses _in for multiple markets", () => {
    const filters = conditionalEventMarketFilters(undefined, ["0xAA", "0xBB"]);
    expect(filters).toHaveLength(1);
    expect(filters[0]).toEqual({ market: { address: { _in: ["0xaa", "0xbb"] } } });
  });

  it("returns no filters for an empty allowlist", () => {
    expect(conditionalEventMarketFilters(undefined, [])).toEqual([]);
  });
});
