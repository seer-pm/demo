import { describe, expect, it } from "vitest";
import { formatLadderPrice, formatShareAmount } from "./format";

describe("formatLadderPrice", () => {
  it("reads prices as cents with two decimals so adjacent ticks stay distinct", () => {
    expect(formatLadderPrice("0.4115")).toBe("41.15¢");
    expect(formatLadderPrice("0.4119")).toBe("41.19¢");
    expect(formatLadderPrice(0.0035)).toBe("0.35¢");
  });

  it("renders unknown prices as an em dash", () => {
    expect(formatLadderPrice(undefined)).toBe("—");
    expect(formatLadderPrice("")).toBe("—");
    expect(formatLadderPrice("abc")).toBe("—");
  });
});

describe("formatShareAmount", () => {
  it("keeps thin levels readable instead of rounding them to 0.00", () => {
    expect(formatShareAmount(0.00412)).toBe("0.00412");
    expect(formatShareAmount(0.0123)).toBe("0.0123");
    expect(formatShareAmount(0.00001)).toBe("<0.0001");
  });

  it("uses two grouped decimals from one and compacts large amounts", () => {
    expect(formatShareAmount(1234.5)).toBe("1,234.50");
    expect(formatShareAmount(25_000)).toBe("25.00k");
  });

  it("reads missing or empty amounts as zero", () => {
    expect(formatShareAmount(0)).toBe("0");
    expect(formatShareAmount(null)).toBe("0");
  });
});
