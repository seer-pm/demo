import {
  AmmTrade,
  COMPLETE_SET_BATCH_GAS_BUDGET,
  type CompleteSetLeg,
  type TradeTokensProps,
  buildCompleteSetTradeBatches7702,
  buildCompleteSetTradeCalls7702,
  countCompleteSetBatches,
  getCompleteSetApprovalTokens,
  getCompleteSetGasProfile,
} from "@seer-pm/sdk";
import type { Address } from "viem";
import { decodeFunctionData, erc20Abi, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

const account = "0x0000000000000000000000000000000000000001" as Address;
const collateralToken = "0x0000000000000000000000000000000000000002" as Address;
const outcomeToken = "0x0000000000000000000000000000000000000003" as Address;
const oppositeOutcomeToken = "0x0000000000000000000000000000000000000004" as Address;

function createMockAmmTrade(
  overrides: {
    approveAddress?: string;
    maximumAmountIn?: () => bigint;
    tokenIn?: { address: Address; symbol: string; decimals: number; chainId: number };
    tokenOut?: { address: Address; symbol: string; decimals: number; chainId: number };
  } = {},
) {
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

  it("costs the same two approvals however many outcomes the split mints", async () => {
    // A nine-outcome market: the leftovers are minted but never moved, so they are never approved.
    const leftoverTokens = Array.from({ length: 9 }, (_, index) => ({
      token: {
        address: `0x${(0x30 + index).toString(16).padStart(40, "0")}` as Address,
        symbol: `OUTCOME_${index}`,
        decimals: 18,
        chainId: 100,
      },
      amount: splitAmount,
    }));
    const leg = createMintToCoverLeg({ leftoverTokens });
    const leftoverAddresses = leftoverTokens.map((leftover) => leftover.token.address);

    const calls = await buildCompleteSetTradeCalls7702(createProps(leg));
    expect(calls).toHaveLength(4);
    expect(calls.map((call) => call.to)).not.toContain(leftoverAddresses[0]);

    const { tokensAddresses, amounts } = getCompleteSetApprovalTokens(createProps(leg));
    expect(tokensAddresses).toEqual([collateralToken, outcomeToken]);
    expect(amounts).toEqual([splitAmount, sellAmount]);
    for (const address of leftoverAddresses) {
      expect(tokensAddresses).not.toContain(address);
    }
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

describe("multi-leg routes", () => {
  const outcomeAddress = (index: number) => `0x${(0x20 + index).toString(16).padStart(40, "0")}` as Address;
  const otherDex = "0x00000000000000000000000000000000000000cd" as Address;

  function createLegTrade(
    tokenIn: Address,
    tokenOut: Address,
    approveAddress: Address = "0x00000000000000000000000000000000000000ab",
  ) {
    return createMockAmmTrade({
      approveAddress,
      tokenIn: { address: tokenIn, symbol: "IN", decimals: 18, chainId: 100 },
      tokenOut: { address: tokenOut, symbol: "OUT", decimals: 18, chainId: 100 },
    });
  }

  function createSwapLegs(
    count: number,
    direction: "sell" | "buy",
    amount: bigint,
    spenderOf?: (index: number) => Address,
  ) {
    return Array.from({ length: count }, (_, index) => {
      const token = outcomeAddress(index);
      return {
        outcomeIndex: index,
        outcomeToken: { address: token, symbol: `OUTCOME_${index}`, decimals: 18, chainId: 100 },
        trade:
          direction === "sell"
            ? createLegTrade(token, collateralToken, spenderOf?.(index))
            : createLegTrade(collateralToken, token, spenderOf?.(index)),
        amount,
      };
    });
  }

  const decodeApprove = (call: { to: Address; data: `0x${string}` }) => {
    const decoded = decodeFunctionData({ abi: erc20Abi, data: call.data });
    expect(decoded.functionName).toBe("approve");
    // viem checksums decoded addresses; the fixtures are lowercase.
    return {
      token: call.to,
      spender: (decoded.args?.[0] as string).toLowerCase() as Address,
      amount: decoded.args?.[1] as bigint,
    };
  };

  it("mint+sell: one approve + swap pair per leg after the split, all in one batch when they fit", async () => {
    const splitAmount = 100n;
    const leg: CompleteSetLeg = {
      ...createBaseCompleteSetLeg("mintSell", { splitAmount }),
      oppositeOutcomeIndex: undefined,
      oppositeOutcomeToken: undefined,
      swapLegs: createSwapLegs(3, "sell", splitAmount),
    };

    const batches = await buildCompleteSetTradeBatches7702(createProps(leg));
    expect(batches).toHaveLength(1);
    const calls = batches[0];
    expect(calls).toHaveLength(2 + 3 * 2);

    expect(decodeApprove(calls[0])).toEqual({
      token: collateralToken,
      spender: expect.any(String),
      amount: splitAmount,
    });
    for (let index = 0; index < 3; index++) {
      const approve = decodeApprove(calls[2 + index * 2]);
      expect(approve.token).toBe(outcomeAddress(index));
      expect(approve.amount).toBe(splitAmount);
    }
    expect(countCompleteSetBatches(createProps(leg))).toBe(1);
  });

  it("mint+sell: too many legs for one transaction spill into further batches, split first", async () => {
    const splitAmount = 100n;
    const leg: CompleteSetLeg = {
      ...createBaseCompleteSetLeg("mintSell", { splitAmount }),
      oppositeOutcomeIndex: undefined,
      oppositeOutcomeToken: undefined,
      swapLegs: createSwapLegs(34, "sell", splitAmount),
    };

    const batches = await buildCompleteSetTradeBatches7702(createProps(leg));
    expect(batches.length).toBeGreaterThan(1);
    expect(countCompleteSetBatches(createProps(leg))).toBe(batches.length);

    // Every call is still there, in order: collateral approval, split, then the 34 pairs.
    const calls = batches.flat();
    expect(calls).toHaveLength(2 + 34 * 2);
    expect(decodeApprove(calls[0]).token).toBe(collateralToken);
    for (const batch of batches.slice(1)) {
      expect(batch.length % 2).toBe(0);
      expect(decodeApprove(batch[0]).token).not.toBe(collateralToken);
    }

    // Each batch fits the budget with the Gnosis profile: split + N legs.
    const gas = getCompleteSetGasProfile(100);
    const legGas = gas.approve + gas.swap + 2n * gas.callOverhead;
    for (const batch of batches.slice(1)) {
      expect((BigInt(batch.length) / 2n) * legGas).toBeLessThanOrEqual(COMPLETE_SET_BATCH_GAS_BUDGET);
    }
  });

  it("buy+merge: one collateral approval per spender, the swaps, then approvals for every burned token and the merge", async () => {
    const mergeAmount = 100n;
    const invalid = "0x00000000000000000000000000000000000000ff" as Address;
    const leg: CompleteSetLeg = {
      ...createBaseCompleteSetLeg("buyMerge", { mergeAmount }),
      targetOutcomeToken: { address: invalid, symbol: "Invalid", decimals: 18, chainId: 100 },
      oppositeOutcomeIndex: undefined,
      oppositeOutcomeToken: undefined,
      swapLegs: createSwapLegs(3, "buy", mergeAmount, (index) =>
        index === 2 ? otherDex : "0x00000000000000000000000000000000000000ab",
      ),
      heldOutcomeTokens: [
        { token: { address: outcomeAddress(3), symbol: "HELD", decimals: 18, chainId: 100 }, amount: mergeAmount },
      ],
    };

    const batches = await buildCompleteSetTradeBatches7702(createProps(leg));
    expect(batches).toHaveLength(1);
    const calls = batches[0];
    // 2 spender approvals + 3 swaps + 5 burned tokens (target, 3 bought, 1 held) + merge
    expect(calls).toHaveLength(2 + 3 + 5 + 1);

    const spenderApprovals = [decodeApprove(calls[0]), decodeApprove(calls[1])];
    expect(spenderApprovals.map((approval) => approval.token)).toEqual([collateralToken, collateralToken]);
    // Two legs share the first DEX: their limits add up into one approval.
    const maxIn = createMockAmmTrade().maximumAmountIn();
    expect(spenderApprovals.find((approval) => approval.spender === otherDex)?.amount).toBe(maxIn);
    expect(spenderApprovals.find((approval) => approval.spender !== otherDex)?.amount).toBe(2n * maxIn);

    const burned = calls.slice(5, 10).map(decodeApprove);
    expect(burned.map((approval) => approval.token)).toEqual([
      invalid,
      outcomeAddress(0),
      outcomeAddress(1),
      outcomeAddress(2),
      outcomeAddress(3),
    ]);
    expect(burned.every((approval) => approval.amount === mergeAmount)).toBe(true);
  });

  it("buy+merge: many legs keep the merge in the last batch and re-approve collateral per batch", async () => {
    const mergeAmount = 100n;
    const leg: CompleteSetLeg = {
      ...createBaseCompleteSetLeg("buyMerge", { mergeAmount }),
      oppositeOutcomeIndex: undefined,
      oppositeOutcomeToken: undefined,
      swapLegs: createSwapLegs(34, "buy", mergeAmount),
    };

    const batches = await buildCompleteSetTradeBatches7702(createProps(leg));
    expect(batches.length).toBeGreaterThan(1);
    expect(countCompleteSetBatches(createProps(leg))).toBe(batches.length);

    for (const batch of batches.slice(0, -1)) {
      expect(decodeApprove(batch[0]).token).toBe(collateralToken);
    }
    const last = batches[batches.length - 1];
    const merge = last[last.length - 1];
    const approveSelector = "0x095ea7b3";
    expect(merge.data.slice(0, 10)).not.toBe(approveSelector);
    // ...and no batch but the last carries the merge.
    for (const batch of batches.slice(0, -1)) {
      expect(batch.every((call) => call.data.slice(0, 10) === approveSelector || call.to !== merge.to)).toBe(true);
    }
  });

  it("lists every approval the sequential path needs, grouped per spender for the buys", () => {
    const mergeAmount = 100n;
    const leg: CompleteSetLeg = {
      ...createBaseCompleteSetLeg("buyMerge", { mergeAmount }),
      oppositeOutcomeIndex: undefined,
      oppositeOutcomeToken: undefined,
      swapLegs: createSwapLegs(3, "buy", mergeAmount, (index) =>
        index === 0 ? otherDex : "0x00000000000000000000000000000000000000ab",
      ),
    };

    const { tokensAddresses, spenders, amounts } = getCompleteSetApprovalTokens(createProps(leg));
    // collateral to two spenders, then target + 3 bought tokens to the router
    expect(tokensAddresses).toHaveLength(2 + 4);
    expect(tokensAddresses.slice(0, 2)).toEqual([collateralToken, collateralToken]);
    expect(new Set(spenders.slice(0, 2))).toEqual(new Set([otherDex, "0x00000000000000000000000000000000000000ab"]));
    expect(tokensAddresses.slice(2)).toEqual([outcomeToken, outcomeAddress(0), outcomeAddress(1), outcomeAddress(2)]);
    expect(amounts.slice(2).every((amount) => amount === mergeAmount)).toBe(true);
  });
});
