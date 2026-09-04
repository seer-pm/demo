import type { Address } from "viem";
import { describe, expect, it } from "vitest";
import { mergeTokenHolders } from "./marketLiquidityHolders";

const TOKEN = "0x0000000000000000000000000000000000000001";
const ALICE = "0x0000000000000000000000000000000000000002" as Address;
const BOB = "0x0000000000000000000000000000000000000003" as Address;
const POOL = "0x0000000000000000000000000000000000000004" as Address;

describe("mergeTokenHolders", () => {
  it("adds direct and LP balances and sorts the result", () => {
    const result = mergeTokenHolders(
      { [TOKEN]: [{ address: ALICE, balance: "10" }] },
      {
        [TOKEN]: [
          { address: ALICE, balance: "5" },
          { address: BOB, balance: "20" },
        ],
      },
      [],
    );

    expect(result[TOKEN]).toEqual([
      { address: BOB, balance: "20" },
      { address: ALICE, balance: "15" },
    ]);
  });

  it("excludes pool contract balances", () => {
    const result = mergeTokenHolders(
      {
        [TOKEN]: [
          { address: POOL, balance: "100" },
          { address: ALICE, balance: "10" },
        ],
      },
      { [TOKEN]: [{ address: BOB, balance: "20" }] },
      [POOL],
    );

    expect(result[TOKEN]).toEqual([
      { address: BOB, balance: "20" },
      { address: ALICE, balance: "10" },
    ]);
  });
});
