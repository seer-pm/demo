// Imported by path rather than through the `@seer-pm/sdk` barrel: these are pure
// helpers and the barrel drags in generated codegen this test does not need.
import { applySlippageDown, applySlippageUp } from "../../../packages/seer-pm-sdk/src/amm-trade";
import { describe, expect, it } from "vitest";

/** Reference implementation of `SlippageLib.limit` in the LensQuoter contract. */
function quoterLimit(exactOut: boolean, quoted: bigint, bps: bigint): bigint {
  const BPS = 10_000n;
  return exactOut ? (quoted * (BPS + bps) + BPS - 1n) / BPS : (quoted * (BPS - bps)) / BPS;
}

describe("slippage bounds match the on-chain SlippageLib", () => {
  const BPS_CASES = [0, 1, 50, 100, 500];

  it("rounds the maximum input up, like the quoter", () => {
    // The trade from the fill-to-price report: floor gave …371, the quoter …372.
    const quotedIn = 1_449_093_452_920_483_536n;
    expect(applySlippageUp(quotedIn, 100)).toBe(1_463_584_387_449_688_372n);
    expect(applySlippageUp(quotedIn, 100)).toBe(quoterLimit(true, quotedIn, 100n));
  });

  it("never approves less than the amountInMaximum baked into the calldata", () => {
    for (const bps of BPS_CASES) {
      for (const quoted of [1n, 3n, 7n, 9_999n, 10_001n, 1_449_093_452_920_483_536n]) {
        expect(applySlippageUp(quoted, bps)).toBe(quoterLimit(true, quoted, BigInt(bps)));
      }
    }
  });

  it("rounds the minimum output down, like the quoter", () => {
    for (const bps of BPS_CASES) {
      for (const quoted of [1n, 3n, 7n, 9_999n, 10_001n, 3_425_334_117_375_910_000n]) {
        expect(applySlippageDown(quoted, bps)).toBe(quoterLimit(false, quoted, BigInt(bps)));
      }
    }
  });

  it("leaves exact amounts untouched at zero slippage", () => {
    expect(applySlippageUp(12_345n, 0)).toBe(12_345n);
    expect(applySlippageDown(12_345n, 0)).toBe(12_345n);
  });
});
