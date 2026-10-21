// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ params: new URLSearchParams(), navigations: 0 }));
vi.mock("@/hooks/useSearchParams", () => ({
  useSearchParams: () => [
    state.params,
    (update: (params: URLSearchParams) => URLSearchParams) => {
      state.params = update(state.params);
      state.navigations += 1;
    },
  ],
}));
import { MarketStatus } from "@seer-pm/sdk";
import useMarketsSearchParams from "./useMarketsSearchParams";

describe("market category navigation", () => {
  beforeEach(() => {
    state.params = new URLSearchParams("page=4&marketName=rain&chains=100&category=politics");
    state.navigations = 0;
  });
  it("changes category, resets paging and preserves the search and chain", () => {
    const { result } = renderHook(useMarketsSearchParams);
    act(() => result.current.setCategory("weather"));
    expect(state.params.getAll("category")).toEqual(["weather"]);
    expect(state.params.get("page")).toBe("1");
    expect(state.params.get("marketName")).toBe("rain");
    expect(state.params.get("chains")).toBe("100");
  });
  it("All markets removes categories without clearing other filters", () => {
    const { result } = renderHook(useMarketsSearchParams);
    act(() => result.current.setCategory(""));
    expect(state.params.has("category")).toBe(false);
    expect(state.params.get("chains")).toBe("100");
  });

  it("applies a combined filter selection in one navigation without changing the search or sort", () => {
    state.params.set("orderBy", "volumeUSD");
    state.params.set("orderDirection", "asc");
    const { result } = renderHook(useMarketsSearchParams);
    act(() =>
      result.current.applyFilters({
        marketStatusList: [MarketStatus.OPEN],
        chainsList: ["1", "100"],
        verificationStatusList: ["verified"],
        showConditionalMarkets: true,
        showMarketsWithRewards: true,
        showFutarchyMarkets: false,
        minLiquidity: 250,
      }),
    );
    expect(state.navigations).toBe(1);
    expect(state.params.getAll("chains")).toEqual(["1", "100"]);
    expect(state.params.getAll("marketStatus")).toEqual([MarketStatus.OPEN]);
    expect(state.params.getAll("verificationStatus")).toEqual(["verified"]);
    expect(state.params.get("conditionalMarkets")).toBe("true");
    expect(state.params.get("rewardsMarkets")).toBe("true");
    expect(state.params.get("minLiquidity")).toBe("250");
    expect(state.params.has("type")).toBe(false);
    expect(state.params.get("marketName")).toBe("rain");
    expect(state.params.get("category")).toBe("politics");
    expect(state.params.get("orderBy")).toBe("volumeUSD");
    expect(state.params.get("orderDirection")).toBe("asc");
    expect(state.params.get("page")).toBe("1");
  });

  it("clears restrictions while preserving the search, sort and unrelated URL parameters", () => {
    state.params = new URLSearchParams(
      "page=4&marketName=rain&category=weather&chains=100&conditionalMarkets=true&rewardsMarkets=true&type=Futarchy&marketStatus=open&verificationStatus=verified&minLiquidity=50&orderBy=volumeUSD&orderDirection=asc&lang=en",
    );
    const { result } = renderHook(useMarketsSearchParams);
    act(() => result.current.clearFilters());
    expect(state.navigations).toBe(1);
    expect(Object.fromEntries(state.params)).toEqual({
      page: "1",
      marketName: "rain",
      orderBy: "volumeUSD",
      orderDirection: "asc",
      lang: "en",
    });
    const { result: cleared } = renderHook(useMarketsSearchParams);
    expect(cleared.current.type).toBe("Generic");
    expect(cleared.current.showConditionalMarkets).toBe(false);
    expect(cleared.current.hasFilters).toBeFalsy();
  });

  it("removes the conditional-only restriction without changing the intentional market-type default", () => {
    state.params.set("conditionalMarkets", "true");
    const { result } = renderHook(useMarketsSearchParams);
    act(() =>
      result.current.applyFilters({
        showConditionalMarkets: false,
        showMarketsWithRewards: false,
        showFutarchyMarkets: false,
        minLiquidity: 0,
      }),
    );
    const { result: updated } = renderHook(useMarketsSearchParams);
    expect(state.params.has("conditionalMarkets")).toBe(false);
    expect(state.params.has("type")).toBe(false);
    expect(updated.current.type).toBe("Generic");
  });
});
