import {
  applySlippageToleranceDown,
  applySlippageToleranceUp,
  buildPsm3SwapExactOutExecution,
  isPsm3SwapToken,
} from "@seer-pm/sdk";
import { TOKENS_BY_CHAIN } from "@seer-pm/sdk";
import { base, optimism } from "viem/chains";
import { describe, expect, it } from "vitest";

describe("psm3 helpers", () => {
  it("isPsm3SwapToken identifies USDC and USDS on Base", () => {
    expect(isPsm3SwapToken(base.id, TOKENS_BY_CHAIN[base.id].USDC)).toBe(true);
    expect(isPsm3SwapToken(base.id, TOKENS_BY_CHAIN[base.id].USDS)).toBe(true);
    expect(isPsm3SwapToken(base.id, TOKENS_BY_CHAIN[base.id].sUSDS)).toBe(false);
  });

  it("isPsm3SwapToken identifies USDC and USDS on Optimism", () => {
    expect(isPsm3SwapToken(optimism.id, TOKENS_BY_CHAIN[optimism.id].USDC)).toBe(true);
    expect(isPsm3SwapToken(optimism.id, TOKENS_BY_CHAIN[optimism.id].USDS)).toBe(true);
    expect(isPsm3SwapToken(optimism.id, TOKENS_BY_CHAIN[optimism.id].sUSDS)).toBe(false);
  });

  it("applySlippageToleranceDown reduces amount by slippage percent", () => {
    expect(applySlippageToleranceDown(10000n, "0.5")).toBe(9950n);
  });

  it("applySlippageToleranceUp increases amount by slippage percent", () => {
    expect(applySlippageToleranceUp(10000n, "0.5")).toBe(10050n);
  });

  it("buildPsm3SwapExactOutExecution encodes swapExactOut", () => {
    const exec = buildPsm3SwapExactOutExecution({
      chainId: base.id,
      assetIn: TOKENS_BY_CHAIN[base.id].USDC,
      assetOut: TOKENS_BY_CHAIN[base.id].sUSDS,
      amountOut: 1000000n,
      maxAmountIn: 1005000n,
      receiver: "0x0000000000000000000000000000000000000001",
    });
    expect(exec.to).toBe("0x1601843c5E9bC251A3272907010AFa41Fa18347E");
    expect(exec.data.startsWith("0x")).toBe(true);
  });
});
