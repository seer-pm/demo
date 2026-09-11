import { formatLeftoverList, summarizeLeftovers } from "@/lib/leftovers";
import type { CompleteSetLeftover } from "@seer-pm/sdk";
import type { Address } from "viem";
import { describe, expect, it } from "vitest";

const leftover = (symbol: string, amount: bigint): CompleteSetLeftover => ({
  token: { address: `0x${symbol.padStart(40, "0")}` as Address, symbol, decimals: 18, chainId: 100 },
  amount,
});

const ONE = 10n ** 18n;

describe("summarizeLeftovers", () => {
  it("is empty when the split leaves nothing behind", () => {
    expect(summarizeLeftovers([])).toBe("");
  });

  it("counts the outcomes rather than listing them", () => {
    expect(summarizeLeftovers([leftover("NO", ONE), leftover("Invalid", ONE)])).toBe(
      "1 of each of the 2 other outcomes",
    );
  });

  it("keeps the singular for a lone leftover", () => {
    expect(summarizeLeftovers([leftover("Invalid", 2n * ONE)])).toBe("2 of each of the 1 other outcome");
  });

  it("stays one line however many outcomes there are", () => {
    const many = Array.from({ length: 9 }, (_, index) => leftover(`OUTCOME${index}`, ONE));
    expect(summarizeLeftovers(many)).toBe("1 of each of the 9 other outcomes");
  });
});

describe("formatLeftoverList", () => {
  it("spells out every token for the detail view", () => {
    expect(formatLeftoverList([leftover("NO", ONE), leftover("Invalid", ONE)])).toBe("1 NO + 1 Invalid");
  });
});
