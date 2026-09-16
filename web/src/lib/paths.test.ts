import { describe, expect, it } from "vitest";
import { paths } from "./paths";

const ADDRESS = "0x000000000000000000000000000000000000dEaD";

describe("paths.portfolio", () => {
  it("prefers the @username route when the wallet has a username", () => {
    expect(paths.portfolio(ADDRESS, "alice")).toBe("/portfolio/@alice");
  });

  it("falls back to the address route without a username", () => {
    // Every table row carries `username?`, and the API omits it, nulls it or leaves it empty.
    expect(paths.portfolio(ADDRESS)).toBe(`/portfolio/${ADDRESS}`);
    expect(paths.portfolio(ADDRESS, null)).toBe(`/portfolio/${ADDRESS}`);
    expect(paths.portfolio(ADDRESS, "")).toBe(`/portfolio/${ADDRESS}`);
  });

  it("agrees with portfolioUsername, which the canonical redirect uses", () => {
    expect(paths.portfolio(ADDRESS, "alice")).toBe(paths.portfolioUsername("alice"));
  });
});
