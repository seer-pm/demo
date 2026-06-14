import { getSplitMergeRedeemCollateral } from "@/hooks/useSelectedCollateral";
import { TOKENS_BY_CHAIN, getActivePrimaryCollateral, getSplitExecution } from "@seer-pm/sdk";
import type { Market, Token } from "@seer-pm/sdk";
import { decodeFunctionData, zeroAddress } from "viem";
import { gnosis } from "viem/chains";
import { describe, expect, it } from "vitest";
import { gnosisRouterAbi, routerAbi } from "../../../packages/seer-pm-sdk/generated/contracts/router";

const GNOSIS_SDAI = TOKENS_BY_CHAIN[gnosis.id].sDAI;
const GNOSIS_XDAI = TOKENS_BY_CHAIN[gnosis.id].xDAI;

const createMarket = (overrides: Partial<Market> = {}): Market =>
  ({
    id: "0x00000000000000000000000000000000000000aa",
    type: "Generic",
    chainId: gnosis.id,
    parentMarket: { id: zeroAddress, conditionId: "0x0", payoutReported: false, payoutNumerators: [] },
    ...overrides,
  }) as Market;

const asToken = (address: `0x${string}`): Token =>
  ({ address, symbol: "TEST", decimals: 18, name: "Test", chainId: gnosis.id }) as Token;

describe("getSplitMergeRedeemCollateral", () => {
  it("returns sDAI when primary collateral is selected", () => {
    const market = createMarket();
    expect(getSplitMergeRedeemCollateral(market, asToken(GNOSIS_SDAI), false)).toBe(GNOSIS_SDAI);
  });

  it("returns undefined when alt collateral is selected on primary markets", () => {
    const market = createMarket();
    expect(getSplitMergeRedeemCollateral(market, asToken(GNOSIS_XDAI), true)).toBeUndefined();
  });

  it("returns selected collateral for Futarchy markets", () => {
    const market = createMarket({ type: "Futarchy" });
    expect(getSplitMergeRedeemCollateral(market, asToken(GNOSIS_XDAI), true)).toBe(GNOSIS_XDAI);
  });

  it("returns active primary collateral for conditional markets", () => {
    const market = createMarket({
      parentMarket: {
        id: "0x00000000000000000000000000000000000000bb",
        conditionId: "0x0",
        payoutReported: false,
        payoutNumerators: [],
      },
    });
    expect(getSplitMergeRedeemCollateral(market, asToken(GNOSIS_XDAI), true)).toBe(
      getActivePrimaryCollateral(gnosis.id).address,
    );
  });
});

describe("split execution collateral paths", () => {
  const market = createMarket();
  const router = "0x0000000000000000000000000000000000000001";
  const amount = 1000n;

  it("uses splitPosition for primary collateral (fill-to-estimate path)", () => {
    const execution = getSplitExecution({
      router,
      market,
      collateralToken: GNOSIS_SDAI,
      amount,
    });
    const decoded = decodeFunctionData({ abi: routerAbi, data: execution.data });
    expect(decoded.functionName).toBe("splitPosition");
    expect(execution.value).toBe(0n);
  });

  it("uses splitFromBase for alt collateral (split form xDAI path)", () => {
    const execution = getSplitExecution({
      router,
      market,
      collateralToken: getSplitMergeRedeemCollateral(market, asToken(GNOSIS_XDAI), true),
      amount,
    });
    const decoded = decodeFunctionData({ abi: gnosisRouterAbi, data: execution.data });
    expect(decoded.functionName).toBe("splitFromBase");
    expect(execution.value).toBe(amount);
  });
});
