import { TOKENS_BY_CHAIN } from "@seer-pm/sdk";
import { parseUnits } from "viem";
import { base } from "viem/chains";
import { describe, expect, it } from "vitest";
import { formatRawTxAmount, tokenDecimals } from "./history-tx-amount";

describe("formatRawTxAmount", () => {
  it("treats missing and 0n as zero", () => {
    expect(formatRawTxAmount(undefined, 18)).toBe("0");
    expect(formatRawTxAmount("", 18)).toBe("0");
    expect(formatRawTxAmount("0n", 18)).toBe("0");
  });

  it("formats raw wei integers with 18 decimals", () => {
    expect(formatRawTxAmount("1000000000000000000", 18)).toBe("1");
  });

  it("formats dotted decimal strings via parseUnits", () => {
    expect(formatRawTxAmount("1.5", 18)).toBe("1.50");
  });

  it("formats USDC wei with 6 decimals", () => {
    expect(formatRawTxAmount("1500000", 6)).toBe("1.50");
  });

  it("does not parse integer wei through parseUnits", () => {
    const wei = "1000000000000000000";
    expect(formatRawTxAmount(wei, 18)).toBe("1");
    expect(formatRawTxAmount(wei, 18)).not.toBe(formatRawTxAmount(parseUnits(wei, 18).toString(), 18));
  });
});

describe("tokenDecimals", () => {
  it("returns 18 when the token is unknown or omitted", () => {
    expect(tokenDecimals(base.id, undefined)).toBe(18);
    expect(tokenDecimals(base.id, "0x0000000000000000000000000000000000000001")).toBe(18);
  });

  it("returns 6 for Base USDC", () => {
    expect(tokenDecimals(base.id, TOKENS_BY_CHAIN[base.id].USDC)).toBe(6);
  });
});
