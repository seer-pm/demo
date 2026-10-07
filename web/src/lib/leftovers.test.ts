import { formatLeftoverList, summarizeLeftovers } from "@/lib/leftovers";
import type { CompleteSetLeftover } from "@seer-pm/sdk";
import type { Address } from "viem";
import { describe, expect, it } from "vitest";

const MARKET = "0x0000000000000000000000000000000000000001" as Address;
const PARENT = "0x0000000000000000000000000000000000000002" as Address;
const GRANDPARENT = "0x0000000000000000000000000000000000000003" as Address;

const leftover = (symbol: string, amount: bigint, marketId: Address = MARKET): CompleteSetLeftover => ({
  token: { address: `0x${symbol.padStart(40, "0")}` as Address, symbol, decimals: 18, chainId: 100 },
  amount,
  marketId,
});

const ONE = 10n ** 18n;

describe("summarizeLeftovers", () => {
  it("is empty when the split leaves nothing behind", () => {
    expect(summarizeLeftovers([], MARKET)).toBe("");
  });

  it("counts the outcomes rather than listing them", () => {
    expect(summarizeLeftovers([leftover("NO", ONE), leftover("Invalid", ONE)], MARKET)).toBe(
      "1 of each of the 2 other outcomes",
    );
  });

  it("keeps the singular for a lone leftover", () => {
    expect(summarizeLeftovers([leftover("Invalid", 2n * ONE)], MARKET)).toBe("2 of each of the 1 other outcome");
  });

  it("stays one line however many outcomes there are", () => {
    const many = Array.from({ length: 9 }, (_, index) => leftover(`OUTCOME${index}`, ONE));
    expect(summarizeLeftovers(many, MARKET)).toBe("1 of each of the 9 other outcomes");
  });

  it("counts the ancestors' leftovers apart from the market's own", () => {
    const one = [leftover("P_NO", ONE, PARENT), leftover("P_Invalid", ONE, PARENT), leftover("NO", ONE)];
    expect(summarizeLeftovers(one, MARKET)).toBe(
      "1 of each of the 1 other outcome of this market and 2 of its parent market",
    );
    const two = [leftover("G_NO", ONE, GRANDPARENT), ...one];
    expect(summarizeLeftovers(two, MARKET)).toBe(
      "1 of each of the 1 other outcome of this market and 3 of its parent markets",
    );
  });
});

describe("formatLeftoverList", () => {
  it("spells out every token for the detail view", () => {
    expect(formatLeftoverList([leftover("NO", ONE), leftover("Invalid", ONE)])).toBe("1 NO + 1 Invalid");
  });
});
