/**
 * Complete-set execution through the CompleteSetTrader: one trader call per route, preceded only
 * by the approvals for what the trader pulls from the wallet.
 */
import {
  AmmTrade,
  COMPLETE_SET_TX_GAS_BUDGET,
  type CompleteSetLeg,
  type TradeTokensProps,
  buildCompleteSetTradeCalls7702,
  completeSetTraderAbi,
  completeSetTraderAddress,
  estimateCompleteSetGas,
  getCompleteSetApprovalTokens,
} from "@seer-pm/sdk";
import type { Address, Hex } from "viem";
import { decodeFunctionData, erc20Abi } from "viem";
import { describe, expect, it, vi } from "vitest";

const account = "0x0000000000000000000000000000000000000001" as Address;
const collateralToken = "0x0000000000000000000000000000000000000002" as Address;
const outcomeToken = "0x0000000000000000000000000000000000000003" as Address;
const oppositeOutcomeToken = "0x0000000000000000000000000000000000000004" as Address;
const invalidToken = "0x00000000000000000000000000000000000000ff" as Address;
const dex = "0x00000000000000000000000000000000000000ab" as Address;
const otherDex = "0x00000000000000000000000000000000000000cd" as Address;
const trader = "0x0000000000000000000000000000000000007a5e" as Address;
const marketId = "0x0000000000000000000000000000000000000abc" as Address;

Object.assign(completeSetTraderAddress, { 100: trader });

const lower = (address: string) => address.toLowerCase();

function createMockAmmTrade(
  overrides: {
    approveAddress?: string;
    maximumAmountIn?: () => bigint;
    tokenIn?: { address: Address; symbol: string; decimals: number; chainId: number };
    tokenOut?: { address: Address; symbol: string; decimals: number; chainId: number };
    swapData?: Hex;
  } = {},
) {
  const { swapData = "0x1234", ...rest } = overrides;
  const trade = Object.create(AmmTrade.prototype) as AmmTrade;
  Object.assign(trade, {
    approveAddress: dex,
    chainId: 100,
    tokenIn: { address: collateralToken, symbol: "sDAI", decimals: 18, chainId: 100 },
    tokenOut: { address: outcomeToken, symbol: "YES", decimals: 18, chainId: 100 },
    amountIn: 1000000000000000000n,
    amountOut: 1000000000000000000n,
    maximumAmountIn: () => 1000000000000000000n,
    swapTransaction: vi.fn(async () => ({ to: rest.approveAddress ?? dex, data: swapData, value: 0n })),
    ...rest,
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
    market: { id: marketId, type: "Generic", chainId: 100 },
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

const decodeApprove = (call: { to: Address; data: Hex }) => {
  const decoded = decodeFunctionData({ abi: erc20Abi, data: call.data });
  expect(decoded.functionName).toBe("approve");
  // viem checksums decoded addresses; the fixtures are lowercase.
  return {
    token: call.to,
    spender: lower(decoded.args?.[0] as string),
    amount: decoded.args?.[1] as bigint,
  };
};

function decodeMintAndSell(call: { to: Address; data: Hex }) {
  expect(call.to).toBe(trader);
  const decoded = decodeFunctionData({ abi: completeSetTraderAbi, data: call.data });
  expect(decoded.functionName).toBe("mintAndSell");
  const [collateral, market, splitAmount, heldTokens, heldAmounts, soldTokens, swaps] = decoded.args as readonly [
    Address,
    Address,
    bigint,
    readonly Address[],
    readonly bigint[],
    readonly Address[],
    readonly { target: Address; data: Hex }[],
  ];
  return {
    collateral: lower(collateral),
    market: lower(market),
    splitAmount,
    heldTokens: heldTokens.map(lower),
    heldAmounts: [...heldAmounts],
    soldTokens: soldTokens.map(lower),
    swaps: swaps.map((swap) => ({ target: lower(swap.target), data: swap.data })),
  };
}

function decodeBuyAndMerge(call: { to: Address; data: Hex }) {
  expect(call.to).toBe(trader);
  const decoded = decodeFunctionData({ abi: completeSetTraderAbi, data: call.data });
  expect(decoded.functionName).toBe("buyAndMerge");
  const [collateral, market, mergeAmount, maxCollateralIn, heldTokens, heldAmounts, swaps] = decoded.args as readonly [
    Address,
    Address,
    bigint,
    bigint,
    readonly Address[],
    readonly bigint[],
    readonly { target: Address; data: Hex }[],
  ];
  return {
    collateral: lower(collateral),
    market: lower(market),
    mergeAmount,
    maxCollateralIn,
    heldTokens: heldTokens.map(lower),
    heldAmounts: [...heldAmounts],
    swaps: swaps.map((swap) => ({ target: lower(swap.target), data: swap.data })),
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

  it("throws when the trader is not deployed on the chain", async () => {
    const leg = createBaseCompleteSetLeg("mintSell", { splitAmount: 1_000n });
    leg.market = { ...leg.market, chainId: 10 };

    await expect(buildCompleteSetTradeCalls7702(createProps(leg))).rejects.toThrow(
      "CompleteSetTrader is not deployed on chain 10",
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

  it("approves the split and the held tokens to the trader, then sells the whole balance", async () => {
    const trade = createMockAmmTrade();
    const calls = await buildCompleteSetTradeCalls7702(createProps(createMintToCoverLeg(), trade));

    expect(calls).toHaveLength(3);
    expect(decodeApprove(calls[0])).toEqual({ token: collateralToken, spender: trader, amount: splitAmount });
    // The regression this guards: the sell leg moves minted + already held tokens, so the held part
    // has to reach the trader.
    expect(decodeApprove(calls[1])).toEqual({ token: outcomeToken, spender: trader, amount: sellAmount - splitAmount });

    const call = decodeMintAndSell(calls[2]);
    expect(call).toEqual({
      collateral: collateralToken,
      market: marketId,
      splitAmount,
      heldTokens: [outcomeToken],
      heldAmounts: [sellAmount - splitAmount],
      soldTokens: [outcomeToken],
      swaps: [{ target: dex, data: "0x1234" }],
    });
    // The swap is rebuilt with the trader as recipient.
    expect(trade.swapTransaction).toHaveBeenCalledWith({ recipient: trader });
  });

  it("reports both approvals against the trader", () => {
    const { tokensAddresses, spenders, amounts } = getCompleteSetApprovalTokens(createProps(createMintToCoverLeg()));

    expect(tokensAddresses).toEqual([collateralToken, outcomeToken]);
    expect(spenders).toEqual([trader, trader]);
    expect(amounts).toEqual([splitAmount, sellAmount - splitAmount]);
  });

  it("pulls nothing but the collateral when the user held none of the outcome", async () => {
    const calls = await buildCompleteSetTradeCalls7702(
      createProps(createMintToCoverLeg({ swapInputAmount: splitAmount, existingBalance: 0n })),
    );

    expect(calls).toHaveLength(2);
    expect(decodeMintAndSell(calls[1]).heldTokens).toEqual([]);
  });

  it("leaves mintSell defaults untouched: the opposite outcome is sold", async () => {
    const calls = await buildCompleteSetTradeCalls7702(
      createProps(createBaseCompleteSetLeg("mintSell", { splitAmount })),
    );

    expect(calls).toHaveLength(2);
    expect(decodeApprove(calls[0])).toEqual({ token: collateralToken, spender: trader, amount: splitAmount });
    const call = decodeMintAndSell(calls[1]);
    expect(call.soldTokens).toEqual([oppositeOutcomeToken]);
    expect(call.heldTokens).toEqual([]);
  });
});

describe("multi-leg routes", () => {
  const outcomeAddress = (index: number) => `0x${(0x20 + index).toString(16).padStart(40, "0")}` as Address;

  function createLegTrade(tokenIn: Address, tokenOut: Address, approveAddress: Address = dex, swapData?: Hex) {
    return createMockAmmTrade({
      approveAddress,
      tokenIn: { address: tokenIn, symbol: "IN", decimals: 18, chainId: 100 },
      tokenOut: { address: tokenOut, symbol: "OUT", decimals: 18, chainId: 100 },
      swapData,
    });
  }

  function createSwapLegs(
    count: number,
    direction: "sell" | "buy",
    amount: bigint,
    dexOf?: (index: number) => Address,
  ) {
    return Array.from({ length: count }, (_, index) => {
      const token = outcomeAddress(index);
      const swapData = `0x${(index + 1).toString(16).padStart(4, "0")}` as Hex;
      return {
        outcomeIndex: index,
        outcomeToken: { address: token, symbol: `OUTCOME_${index}`, decimals: 18, chainId: 100 },
        trade:
          direction === "sell"
            ? createLegTrade(token, collateralToken, dexOf?.(index), swapData)
            : createLegTrade(collateralToken, token, dexOf?.(index), swapData),
        amount,
      };
    });
  }

  it("mint+sell: one collateral approval and one trader call selling every leg, in order", async () => {
    const splitAmount = 100n;
    const swapLegs = createSwapLegs(3, "sell", splitAmount, (index) => (index === 1 ? otherDex : dex));
    const leg: CompleteSetLeg = {
      ...createBaseCompleteSetLeg("mintSell", { splitAmount }),
      oppositeOutcomeIndex: undefined,
      oppositeOutcomeToken: undefined,
      swapLegs,
    };

    const calls = await buildCompleteSetTradeCalls7702(createProps(leg));
    expect(calls).toHaveLength(2);
    expect(decodeApprove(calls[0])).toEqual({ token: collateralToken, spender: trader, amount: splitAmount });

    const call = decodeMintAndSell(calls[1]);
    expect(call.splitAmount).toBe(splitAmount);
    expect(call.heldTokens).toEqual([]);
    expect(call.soldTokens).toEqual([outcomeAddress(0), outcomeAddress(1), outcomeAddress(2)]);
    expect(call.swaps).toEqual([
      { target: dex, data: "0x0001" },
      { target: otherDex, data: "0x0002" },
      { target: dex, data: "0x0003" },
    ]);
    for (const swapLeg of swapLegs) {
      expect(swapLeg.trade.swapTransaction).toHaveBeenCalledWith({ recipient: trader });
    }
  });

  it("buy+merge: approves the collateral at the summed slippage limit and every contributed token", async () => {
    const mergeAmount = 100n;
    const held = 40n;
    const leg: CompleteSetLeg = {
      ...createBaseCompleteSetLeg("buyMerge", { mergeAmount }),
      targetOutcomeToken: { address: invalidToken, symbol: "Invalid", decimals: 18, chainId: 100 },
      oppositeOutcomeIndex: undefined,
      oppositeOutcomeToken: undefined,
      swapLegs: createSwapLegs(3, "buy", mergeAmount, (index) => (index === 2 ? otherDex : dex)),
      heldOutcomeTokens: [
        { token: { address: outcomeAddress(3), symbol: "HELD", decimals: 18, chainId: 100 }, amount: held },
      ],
    };

    const calls = await buildCompleteSetTradeCalls7702(createProps(leg));
    expect(calls).toHaveLength(4);
    const maxIn = createMockAmmTrade().maximumAmountIn();
    expect(decodeApprove(calls[0])).toEqual({ token: collateralToken, spender: trader, amount: 3n * maxIn });
    expect(decodeApprove(calls[1])).toEqual({ token: invalidToken, spender: trader, amount: mergeAmount });
    expect(decodeApprove(calls[2])).toEqual({ token: outcomeAddress(3), spender: trader, amount: held });

    const call = decodeBuyAndMerge(calls[3]);
    expect(call.mergeAmount).toBe(mergeAmount);
    expect(call.maxCollateralIn).toBe(3n * maxIn);
    expect(call.heldTokens).toEqual([invalidToken, outcomeAddress(3)]);
    expect(call.heldAmounts).toEqual([mergeAmount, held]);
    expect(call.swaps.map((swap) => swap.target)).toEqual([dex, dex, otherDex]);
  });

  it("buy+merge on a binary market: the user contributes the target and Invalid", async () => {
    const mergeAmount = 100n;
    const leg: CompleteSetLeg = {
      ...createBaseCompleteSetLeg("buyMerge", { mergeAmount }),
      invalidOutcomeToken: { address: invalidToken, symbol: "Invalid", decimals: 18, chainId: 100 },
    };

    const calls = await buildCompleteSetTradeCalls7702(createProps(leg));
    expect(calls).toHaveLength(4);
    const call = decodeBuyAndMerge(calls[3]);
    expect(call.heldTokens).toEqual([outcomeToken, invalidToken]);
    expect(call.heldAmounts).toEqual([mergeAmount, mergeAmount]);
    expect(call.swaps).toHaveLength(1);
  });

  it("lists every approval the sequential path needs, all against the trader", () => {
    const mergeAmount = 100n;
    const leg: CompleteSetLeg = {
      ...createBaseCompleteSetLeg("buyMerge", { mergeAmount }),
      oppositeOutcomeIndex: undefined,
      oppositeOutcomeToken: undefined,
      swapLegs: createSwapLegs(3, "buy", mergeAmount),
    };

    const { tokensAddresses, spenders, amounts } = getCompleteSetApprovalTokens(createProps(leg));
    expect(tokensAddresses).toEqual([collateralToken, outcomeToken]);
    expect(spenders).toEqual([trader, trader]);
    expect(amounts).toEqual([3n * createMockAmmTrade().maximumAmountIn(), mergeAmount]);
  });
});

describe("estimateCompleteSetGas", () => {
  it("fits a small market in one transaction and refuses the Gnosis long tail", () => {
    expect(
      estimateCompleteSetGas({ chainId: 100, route: "mintSell", legCount: 3, outcomeCount: 4 }),
    ).toBeLessThanOrEqual(COMPLETE_SET_TX_GAS_BUDGET);
    expect(
      estimateCompleteSetGas({ chainId: 100, route: "buyMerge", legCount: 3, outcomeCount: 4 }),
    ).toBeLessThanOrEqual(COMPLETE_SET_TX_GAS_BUDGET);
    expect(estimateCompleteSetGas({ chainId: 100, route: "mintSell", legCount: 34, outcomeCount: 35 })).toBeGreaterThan(
      COMPLETE_SET_TX_GAS_BUDGET,
    );
  });

  it("plans Swapr swaps as dearer than Uniswap ones", () => {
    const gnosis = estimateCompleteSetGas({ chainId: 100, route: "mintSell", legCount: 10, outcomeCount: 11 });
    const mainnet = estimateCompleteSetGas({ chainId: 1, route: "mintSell", legCount: 10, outcomeCount: 11 });
    expect(gnosis).toBeGreaterThan(mainnet);
  });
});
