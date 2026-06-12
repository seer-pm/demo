import { type CompleteSetLeg, type TradeTokensProps, buildCompleteSetTradeCalls7702 } from "@seer-pm/sdk";
import { SwaprV3Trade } from "@swapr/sdk";
import type { Address } from "viem";
import { zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

const account = "0x0000000000000000000000000000000000000001" as Address;
const collateralToken = "0x0000000000000000000000000000000000000002" as Address;
const outcomeToken = "0x0000000000000000000000000000000000000003" as Address;
const oppositeOutcomeToken = "0x0000000000000000000000000000000000000004" as Address;

function createMockSwaprTrade(
  overrides: { approveAddress?: string; maximumAmountIn?: () => { raw: { toString: () => string } } } = {},
) {
  const trade = Object.create(SwaprV3Trade.prototype) as SwaprV3Trade;
  Object.assign(trade, {
    approveAddress: "0x00000000000000000000000000000000000000ab",
    chainId: 100,
    maximumAmountIn: () => ({ raw: { toString: () => "1000000000000000000" } }),
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
    secondaryTrade: createMockSwaprTrade(),
    market: { id: zeroAddress, type: "Generic", chainId: 100 },
    collateralToken,
    targetOutcomeIndex: 0,
    oppositeOutcomeIndex: 1,
    targetOutcomeToken: { address: outcomeToken, symbol: "YES", decimals: 18, chainId: 100 },
    oppositeOutcomeToken: { address: oppositeOutcomeToken, symbol: "NO", decimals: 18, chainId: 100 },
    ...amounts,
  };
}

function createProps(completeSetLeg: CompleteSetLeg, trade = createMockSwaprTrade()): TradeTokensProps {
  return {
    trade,
    account,
    isBuyExactOutputNative: false,
    isSellToNative: false,
    isSeerCredits: false,
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
    const trade = createMockSwaprTrade({ approveAddress: undefined });
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
    const trade = createMockSwaprTrade({
      maximumAmountIn: () => ({ raw: { toString: () => "0" } }),
    });
    const props = createProps(createBaseCompleteSetLeg("buyMerge", { mergeAmount: 1_000n }), trade);

    await expect(buildCompleteSetTradeCalls7702(props)).rejects.toThrow(
      "Complete-set trade requires a positive maximum amount in",
    );
  });
});
