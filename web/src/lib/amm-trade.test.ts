import { type Token, TradeType, quoteAmmTrade } from "@seer-pm/sdk";
import type { Address, PublicClient } from "viem";
import { ContractFunctionExecutionError, ContractFunctionRevertedError } from "viem";
import { afterEach, describe, expect, it, vi } from "vitest";

const quoteMock = vi.hoisted(() => vi.fn());

vi.mock("@seer-pm/lens/client", () => ({
  Lens: class {
    quote = quoteMock;
  },
}));

const outcomeToken: Token = {
  address: "0x0000000000000000000000000000000000000003" as Address,
  symbol: "YES",
  decimals: 18,
  chainId: 100,
};
const collateralToken: Token = {
  address: "0x0000000000000000000000000000000000000002" as Address,
  symbol: "sDAI",
  decimals: 18,
  chainId: 100,
};

const params = {
  chainId: 100,
  account: "0x0000000000000000000000000000000000000001" as Address,
  amount: "10",
  outcomeToken,
  collateralToken,
  swapType: "sell" as const,
  maxSlippage: "1",
  tradeType: TradeType.EXACT_INPUT,
};

/**
 * Same shape viem's `readContract` throws in production: the ABI from `@seer-pm/lens` declares no
 * custom errors, so the revert data is only known by its 4-byte selector.
 */
function lensRevert(data: `0x${string}`) {
  return new ContractFunctionExecutionError(
    new ContractFunctionRevertedError({ abi: [], functionName: "buildBestSwap", data }),
    { abi: [], functionName: "buildBestSwap", args: [] },
  );
}

describe("quoteAmmTrade", () => {
  afterEach(() => {
    quoteMock.mockReset();
  });

  it("maps the LensQuoter NoRoute() revert to the message the UI understands", async () => {
    quoteMock.mockRejectedValueOnce(lensRevert("0x6586e129"));

    await expect(quoteAmmTrade({} as PublicClient, params)).rejects.toThrow("No route found");
  });

  it("maps a NoRoute() revert decoded by name", async () => {
    quoteMock.mockRejectedValueOnce(
      new ContractFunctionExecutionError(
        new ContractFunctionRevertedError({
          abi: [{ type: "error", name: "NoRoute", inputs: [] }],
          functionName: "buildBestSwap",
          data: "0x6586e129",
        }),
        { abi: [], functionName: "buildBestSwap", args: [] },
      ),
    );

    await expect(quoteAmmTrade({} as PublicClient, params)).rejects.toThrow("No route found");
  });

  it("propagates other reverts unchanged", async () => {
    const error = lensRevert("0xdeadbeef");
    quoteMock.mockRejectedValueOnce(error);

    await expect(quoteAmmTrade({} as PublicClient, params)).rejects.toBe(error);
  });

  it("propagates non-viem errors unchanged", async () => {
    const error = new Error("Swap too large for available liquidity");
    quoteMock.mockRejectedValueOnce(error);

    await expect(quoteAmmTrade({} as PublicClient, params)).rejects.toBe(error);
  });
});
