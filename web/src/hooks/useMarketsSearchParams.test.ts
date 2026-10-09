// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ params: new URLSearchParams() }));
vi.mock("@/hooks/useSearchParams", () => ({
  useSearchParams: () => [
    state.params,
    (update: (params: URLSearchParams) => URLSearchParams) => {
      state.params = update(state.params);
    },
  ],
}));
import useMarketsSearchParams from "./useMarketsSearchParams";

describe("market category navigation", () => {
  beforeEach(() => {
    state.params = new URLSearchParams("page=4&marketName=rain&chains=100&category=politics");
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
});
