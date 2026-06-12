import {
  buildFillToEstimateLegEstimates,
  buildFillToEstimatePlan,
  estimateFromOdds,
  getPoolLegDirection,
  getPriceFromVolume,
  isFillToEstimateEnabled,
  targetOddsFromEstimate,
  tickToPrice,
} from "@seer-pm/sdk";
import { REALITY_TEMPLATE_SINGLE_SELECT, REALITY_TEMPLATE_UINT } from "@seer-pm/sdk";
import type { Market } from "@seer-pm/sdk";
import { Address, parseUnits, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

const createMinimalMarket = (overrides: Partial<Market> = {}): Market => ({
  id: zeroAddress,
  type: "Generic",
  marketName: "Test scalar",
  outcomes: ["DOWN", "UP", "Invalid"],
  collateralToken: "0x0000000000000000000000000000000000000001",
  collateralToken1: zeroAddress,
  collateralToken2: zeroAddress,
  wrappedTokens: [
    "0x00000000000000000000000000000000000000aa",
    "0x00000000000000000000000000000000000000bb",
    "0x00000000000000000000000000000000000000cc",
  ],
  parentMarket: {
    id: zeroAddress,
    conditionId: "0x0",
    payoutReported: false,
    payoutNumerators: [],
  },
  parentOutcome: 0n,
  parentCollectionId: "0x0",
  conditionId: "0x0",
  questionId: "0x0",
  templateId: BigInt(REALITY_TEMPLATE_UINT),
  questions: [],
  openingTs: 0,
  finalizeTs: 0,
  encodedQuestions: [],
  lowerBound: 0n,
  upperBound: 100n,
  payoutReported: false,
  payoutNumerators: [],
  chainId: 100,
  outcomesSupply: 0n,
  liquidityUSD: 0,
  openInterestUSD: 0,
  maxLiquidity: 0,
  incentive: 0,
  hasLiquidity: true,
  categories: ["misc"],
  poolBalance: [],
  odds: [50, 50, 0],
  url: "",
  verification: undefined,
  ...overrides,
});

describe("fill-to-estimate math", () => {
  const market = createMinimalMarket();

  it("round-trips target odds and estimate", () => {
    const targetEstimate = 42;
    const oddsResult = targetOddsFromEstimate(targetEstimate, market);
    expect(oddsResult.ok).toBe(true);
    if (!oddsResult.ok) {
      return;
    }

    const estimate = estimateFromOdds(oddsResult.odds0, oddsResult.odds1, market);
    expect(estimate).toBeCloseTo(targetEstimate, 5);
  });

  it("rejects target outside bounds", () => {
    const result = targetOddsFromEstimate(150, market);
    expect(result.ok).toBe(false);
  });

  it("selects buy/sell/skip leg direction", () => {
    expect(getPoolLegDirection(0.4, 0.6)).toBe("buy");
    expect(getPoolLegDirection(0.6, 0.4)).toBe("sell");
    expect(getPoolLegDirection(0.5, 0.5005)).toBe("skip");
  });
});

describe("fill-to-estimate plan", () => {
  const market = createMinimalMarket();

  it("enables only for Generic scalar markets", () => {
    expect(isFillToEstimateEnabled(market)).toBe(true);
    expect(isFillToEstimateEnabled({ ...market, type: "Futarchy" })).toBe(false);
    expect(
      isFillToEstimateEnabled({
        ...market,
        templateId: BigInt(REALITY_TEMPLATE_SINGLE_SELECT),
        lowerBound: 0n,
        upperBound: 0n,
      }),
    ).toBe(false);
  });

  it("returns no-op when target equals current estimate", () => {
    const plan = buildFillToEstimatePlan({
      market,
      targetEstimate: 50,
      currentOdds: [50, 50],
      balances: { collateral: 0n, outcome0: 0n, outcome1: 0n },
      pools: [undefined, undefined],
    });

    expect(plan.legs).toEqual([]);
    expect(plan.currentEstimate).toBe(50);
    expect(plan.achievableEstimate).toBe(50);
  });

  it("scales plan when ideal peak collateral use exceeds max collateral to use", () => {
    const plan = buildFillToEstimatePlan({
      market,
      targetEstimate: 70,
      currentOdds: [30, 70],
      balances: { collateral: parseUnits("100", 18), outcome0: 0n, outcome1: 0n },
      maxCollateralToUse: parseUnits("3", 18),
      pools: [undefined, undefined],
    });

    expect(plan.legs.length).toBeGreaterThan(0);
    expect(plan.isBudgetConstrained).toBe(true);
    expect(plan.userMaxCollateralToUse).toBe(parseUnits("3", 18));
    expect(plan.estimatedPeakCollateralUse).toBeLessThanOrEqual(parseUnits("3", 18));
  });

  it("does not mark budget constrained when max collateral to use exceeds ideal peak use", () => {
    const plan = buildFillToEstimatePlan({
      market,
      targetEstimate: 9,
      currentOdds: [50, 50],
      balances: { collateral: parseUnits("10", 18), outcome0: 0n, outcome1: 0n },
      maxCollateralToUse: parseUnits("10", 18),
      pools: [undefined, undefined],
    });

    expect(plan.isBudgetConstrained).toBe(false);
    if (plan.idealPeakCollateralUse > 0n) {
      expect(plan.idealPeakCollateralUse).toBeLessThanOrEqual(parseUnits("10", 18));
    }
  });

  it("treats maxCollateralToUse 0n as zero budget, not unlimited", () => {
    const plan = buildFillToEstimatePlan({
      market,
      targetEstimate: 70,
      currentOdds: [30, 70],
      balances: { collateral: parseUnits("100", 18), outcome0: 0n, outcome1: 0n },
      maxCollateralToUse: 0n,
      pools: [undefined, undefined],
    });

    expect(plan.userMaxCollateralToUse).toBe(0n);
    expect(plan.estimatedPeakCollateralUse).toBeLessThanOrEqual(0n);
  });

  it("derives poolsTouched from returned legs", () => {
    const plan = buildFillToEstimatePlan({
      market,
      targetEstimate: 70,
      currentOdds: [30, 70],
      balances: { collateral: parseUnits("100", 18), outcome0: 0n, outcome1: 0n },
      maxCollateralToUse: parseUnits("3", 18),
      pools: [undefined, undefined],
    });

    const expectedPoolsTouched = [
      ...new Set(plan.legs.filter((leg) => leg.kind !== "split").map((leg) => leg.outcomeIndex)),
    ];
    expect(plan.poolsTouched).toEqual(expectedPoolsTouched);
  });

  it("estimates sell proceeds from current odds", () => {
    const estimates = buildFillToEstimateLegEstimates(
      [
        { kind: "split", outcomeIndex: 0, amount: parseUnits("10", 18) },
        { kind: "sell", outcomeIndex: 0, amount: parseUnits("10", 18) },
        { kind: "buy", outcomeIndex: 1, amount: parseUnits("5", 18) },
      ],
      [40, 60],
    );

    expect(estimates[0].estimatedSpend).toBe(parseUnits("10", 18));
    expect(estimates[1].estimatedProceeds).toBe(parseUnits("4", 18));
    expect(estimates[2].estimatedSpend).toBe(parseUnits("3", 18));
  });
});

describe("pool-volume", () => {
  it("returns current price when target volume is non-positive", () => {
    const token0: Address = "0x00000000000000000000000000000000000000aa";
    const token1: Address = "0x00000000000000000000000000000000000000bb";
    const pool = {
      liquidity: 10n ** 18n,
      tickSpacing: 60,
      tick: 0,
      token0,
      token1,
    };
    const currentPrice = Number(tickToPrice(0, 18, true)[0]);

    expect(getPriceFromVolume(pool, [], 0, token0, "buy")).toBe(currentPrice);
    expect(getPriceFromVolume(pool, [], -1, token0, "sell")).toBe(currentPrice);
  });
});
