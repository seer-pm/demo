import {
  AmmTrade,
  type CompleteSetLeg,
  type TradeTokensProps,
  buildCompleteSetTradeCalls7702,
  getCompleteSetApprovalTokens,
} from "@seer-pm/sdk";
import type { Address } from "viem";
import { decodeFunctionData, erc20Abi, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

const account = "0x0000000000000000000000000000000000000001" as Address;
const collateralToken = "0x0000000000000000000000000000000000000002" as Address;
const outcomeToken = "0x0000000000000000000000000000000000000003" as Address;
const oppositeOutcomeToken = "0x0000000000000000000000000000000000000004" as Address;

function createMockAmmTrade(overrides: { approveAddress?: string; maximumAmountIn?: () => bigint } = {}) {
  const trade = Object.create(AmmTrade.prototype) as AmmTrade;
  Object.assign(trade, {
    approveAddress: "0x00000000000000000000000000000000000000ab",
    chainId: 100,
    tokenIn: { address: collateralToken, symbol: "sDAI", decimals: 18, chainId: 100 },
    tokenOut: { address: outcomeToken, symbol: "YES", decimals: 18, chainId: 100 },
    amountIn: 1000000000000000000n,
    amountOut: 1000000000000000000n,
    maximumAmountIn: () => 1000000000000000000n,
    swapTransaction: async () => ({
      to: "0x00000000000000000000000000000000000000ab",
      data: "0x",
      value: 0n,
    }),
    ...overrides,
  });
  return trade;
}

function createBaseCompleteSetLeg(
  route: CompleteSetLeg["route"],
  amounts: Partial<Pick<CompleteSetLeg, "splitAmount" | "mergeAmount">>,
): CompleteSetLeg {
  return {
    route,
    secondaryTrade: createMockAmmTrade(),
    market: { id: zeroAddress, type: "Generic", chainId: 100 },
    collateralToken,
    targetOutcomeIndex: 0,
    oppositeOutcomeIndex: 1,
    targetOutcomeToken: { address: outcomeToken, symbol: "YES", decimals: 18, chainId: 100 },
    oppositeOutcomeToken: { address: oppositeOutcomeToken, symbol: "NO", decimals: 18, chainId: 100 },
    ...amounts,
  };
}

function createProps(completeSetLeg: CompleteSetLeg, trade = createMockAmmTrade()): TradeTokensProps {
  return {
    trade,
    account,
    isTradingCredits: false,
    completeSetLeg,
  };
}

describe("validateCompleteSetTradeProps via buildCompleteSetTradeCalls7702", () => {
  it("throws when mintSell route is missing splitAmount", async () => {
    const props = createProps(createBaseCompleteSetLeg("mintSell", {}));

    await expect(buildCompleteSetTradeCalls7702(props)).rejects.toThrow("mintSell route requires splitAmount");
  });

  it("throws when buyMerge route is missing mergeAmount", async () => {
    const props = createProps(createBaseCompleteSetLeg("buyMerge", {}));

    await expect(buildCompleteSetTradeCalls7702(props)).rejects.toThrow("buyMerge route requires mergeAmount");
  });

  it("throws when trade.approveAddress is missing", async () => {
    const trade = createMockAmmTrade({ approveAddress: undefined });
    const props = createProps(createBaseCompleteSetLeg("mintSell", { splitAmount: 1_000n }), trade);

    await expect(buildCompleteSetTradeCalls7702(props)).rejects.toThrow(
      "Complete-set trade requires trade.approveAddress",
    );
  });

  it("throws for unsupported complete-set routes", async () => {
    const completeSetLeg = {
      ...createBaseCompleteSetLeg("mintSell", { splitAmount: 1_000n }),
      route: "direct" as CompleteSetLeg["route"],
    };
    const props = createProps(completeSetLeg);

    await expect(buildCompleteSetTradeCalls7702(props)).rejects.toThrow("Unsupported complete-set route: direct");
  });

  it("throws when maximum amount in is not positive", async () => {
    const trade = createMockAmmTrade({
      maximumAmountIn: () => 0n,
    });
    const props = createProps(createBaseCompleteSetLeg("buyMerge", { mergeAmount: 1_000n }), trade);

    await expect(buildCompleteSetTradeCalls7702(props)).rejects.toThrow(
      "Complete-set trade requires a positive maximum amount in",
    );
  });
});

describe("mintToCover route", () => {
  const splitAmount = 6_000n;
  const sellAmount = 10_000n;

  function createMintToCoverLeg(overrides: Partial<CompleteSetLeg> = {}): CompleteSetLeg {
    return {
      ...createBaseCompleteSetLeg("mintToCover", { splitAmount }),
      swapInputToken: { address: outcomeToken, symbol: "YES", decimals: 18, chainId: 100 },
      swapInputAmount: sellAmount,
      existingBalance: sellAmount - splitAmount,
      ...overrides,
    };
  }

  it("throws when splitAmount is missing", async () => {
    const props = createProps(createMintToCoverLeg({ splitAmount: undefined }));

    await expect(buildCompleteSetTradeCalls7702(props)).rejects.toThrow("mintToCover route requires splitAmount");
  });

  it("splits the shortfall but approves the full sell amount", async () => {
    const calls = await buildCompleteSetTradeCalls7702(createProps(createMintToCoverLeg()));

    expect(calls).toHaveLength(4);

    const [collateralApproval, split, sellApproval] = calls;

    const decodedCollateral = decodeFunctionData({ abi: erc20Abi, data: collateralApproval.data });
    expect(collateralApproval.to).toBe(collateralToken);
    expect(decodedCollateral.functionName).toBe("approve");
    expect(decodedCollateral.args?.[1]).toBe(splitAmount);

    expect(split.data.startsWith("0x")).toBe(true);

    const decodedSell = decodeFunctionData({ abi: erc20Abi, data: sellApproval.data });
    expect(sellApproval.to).toBe(outcomeToken);
    expect(decodedSell.functionName).toBe("approve");
    // The regression this guards: the sell leg moves minted + already held tokens, not just the split.
    expect(decodedSell.args?.[1]).toBe(sellAmount);
    expect(decodedSell.args?.[1]).not.toBe(splitAmount);
  });

  it("reports both approvals with their own spender and amount", () => {
    const trade = createMockAmmTrade();
    const { tokensAddresses, spenders, amounts } = getCompleteSetApprovalTokens(
      createProps(createMintToCoverLeg(), trade),
    );

    expect(tokensAddresses).toEqual([collateralToken, outcomeToken]);
    expect(spenders[1]).toBe(trade.approveAddress);
    expect(amounts).toEqual([splitAmount, sellAmount]);
  });

  it("leaves mintSell defaults untouched", async () => {
    const calls = await buildCompleteSetTradeCalls7702(
      createProps(createBaseCompleteSetLeg("mintSell", { splitAmount })),
    );

    const decodedSell = decodeFunctionData({ abi: erc20Abi, data: calls[2].data });
    expect(calls[2].to).toBe(oppositeOutcomeToken);
    expect(decodedSell.args?.[1]).toBe(splitAmount);
  });
});
