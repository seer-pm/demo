import { describe, expect, it } from "vitest";
import { expandMarketIdsCacheKey } from "./expandMarketIdsCacheKey";

describe("expandMarketIdsCacheKey", () => {
  it("is stable across root order and casing", () => {
    const a = expandMarketIdsCacheKey(10, [
      "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    ]);
    const b = expandMarketIdsCacheKey(10, [
      "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    ]);
    expect(a).toBe(b);
    expect(a.startsWith("10:")).toBe(true);
  });

  it("differs by chainId", () => {
    const ids = ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"] as const;
    expect(expandMarketIdsCacheKey(10, [...ids])).not.toBe(expandMarketIdsCacheKey(100, [...ids]));
  });
});
