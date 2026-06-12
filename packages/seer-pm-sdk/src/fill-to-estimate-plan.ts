import { parseUnits } from "viem";
import type { Address } from "viem";
import {
  getCurrentEstimateFromOdds,
  getPoolLegDirection,
  isEstimateReached,
  simulateEstimateFromPrices,
  targetOddsFromEstimate,
} from "./fill-to-estimate-math";
import { MarketTypes, getMarketType } from "./market";
import { getMarketEstimate, normalizeOdds } from "./market-odds";
import type { Market } from "./market-types";
import { type PoolTick, type PoolVolumeInfo, getPriceFromVolume, getVolumeUntilPrice } from "./pool-volume";

export type FillToEstimateLegKind = "split" | "sell" | "buy";

export interface FillToEstimateLeg {
  kind: FillToEstimateLegKind;
  outcomeIndex: 0 | 1;
  amount: bigint;
}

export interface FillToEstimateLegEstimate {
  leg: FillToEstimateLeg;
  /** Collateral spent on split or buy legs. */
  estimatedSpend?: bigint;
  /** Collateral recovered from sell legs. */
  estimatedProceeds?: bigint;
}

export interface FillToEstimatePlan {
  targetEstimate: number;
  currentEstimate: number;
  achievableEstimate: number;
  /** Net collateral for the full target before scaling. */
  idealNetSpend: bigint;
  /** Peak wallet use for the full target before scaling (e.g. split lock). */
  idealPeakCollateralUse: bigint;
  /** Net collateral after scaling — what the user actually spends. */
  estimatedNetSpend: bigint;
  /** Peak wallet use after scaling. */
  estimatedPeakCollateralUse: bigint;
  /** Max collateral the user is willing to use from wallet. */
  userMaxCollateralToUse: bigint;
  /** True when max-use limit forces a smaller plan. */
  isBudgetConstrained: boolean;
  /** True when achievable estimate falls short of the target. */
  isTargetConstrained: boolean;
  isPartial: boolean;
  legs: FillToEstimateLeg[];
  legEstimates: FillToEstimateLegEstimate[];
  poolsTouched: (0 | 1)[];
  missingCollateralForInventory?: bigint;
  error?: string;
}

export interface FillToEstimateBalances {
  collateral: bigint;
  outcome0: bigint;
  outcome1: bigint;
}

export interface FillToEstimatePoolData {
  pool: PoolVolumeInfo;
  ticks: PoolTick[];
  outcomeAddress: Address;
}

export interface BuildFillToEstimatePlanParams {
  market: Market;
  targetEstimate: number;
  currentOdds: number[];
  balances: FillToEstimateBalances;
  /** Max collateral the user is willing to use from wallet (peak utilization). */
  maxCollateralToUse?: bigint;
  pools: [FillToEstimatePoolData | undefined, FillToEstimatePoolData | undefined];
}

type DraftSwapLeg = {
  kind: "sell" | "buy";
  outcomeIndex: 0 | 1;
  volume: number;
  targetPrice: number;
};

const LEG_EXECUTION_ORDER: Record<FillToEstimateLegKind, number> = {
  split: 0,
  sell: 1,
  buy: 2,
};

function parseVolume(volume: number): bigint {
  if (volume <= 0 || !Number.isFinite(volume)) {
    return 0n;
  }
  return parseUnits(volume.toFixed(18), 18);
}

function getOutcomePrice(odds: number[], outcomeIndex: 0 | 1): number {
  return odds[outcomeIndex] / 100;
}

function orderLegs(legs: FillToEstimateLeg[]): FillToEstimateLeg[] {
  return [...legs].sort((a, b) => LEG_EXECUTION_ORDER[a.kind] - LEG_EXECUTION_ORDER[b.kind]);
}

function buildDraftSwapLegs(
  market: Market,
  targetEstimate: number,
  currentOdds: number[],
  pools: [FillToEstimatePoolData | undefined, FillToEstimatePoolData | undefined],
): { legs: DraftSwapLeg[]; targetPrices: [number, number]; error?: string } {
  const targetOddsResult = targetOddsFromEstimate(targetEstimate, market);
  if (!targetOddsResult.ok) {
    return { legs: [], targetPrices: [0, 0], error: targetOddsResult.reason };
  }

  const legs: DraftSwapLeg[] = [];
  const tradeableOutcomes: (0 | 1)[] = [0, 1];

  for (const outcomeIndex of tradeableOutcomes) {
    const pool = pools[outcomeIndex];
    if (!pool) {
      continue;
    }

    const currentPrice = getOutcomePrice(currentOdds, outcomeIndex);
    const targetPrice = targetOddsResult.targetPrices[outcomeIndex];
    const direction = getPoolLegDirection(currentPrice, targetPrice);
    if (direction === "skip") {
      continue;
    }

    const volume = getVolumeUntilPrice(pool.pool, pool.ticks, targetPrice, pool.outcomeAddress, direction);
    if (volume <= 0) {
      continue;
    }

    legs.push({
      kind: direction,
      outcomeIndex,
      volume,
      targetPrice,
    });
  }

  return { legs, targetPrices: targetOddsResult.targetPrices };
}

function getInventoryCollateralCap(balances: FillToEstimateBalances, maxCollateralToUse?: bigint): bigint {
  if (maxCollateralToUse === undefined) {
    return balances.collateral;
  }
  return maxCollateralToUse < balances.collateral ? maxCollateralToUse : balances.collateral;
}

function appendInventoryLegs(
  draftLegs: DraftSwapLeg[],
  balances: FillToEstimateBalances,
  inventoryCollateralCap: bigint,
): { legs: FillToEstimateLeg[]; missingCollateralForInventory: bigint } {
  const legs: FillToEstimateLeg[] = [];
  let missingCollateralForInventory = 0n;
  let remainingCollateral = inventoryCollateralCap;

  for (const draft of draftLegs) {
    if (draft.kind === "buy") {
      legs.push({
        kind: "buy",
        outcomeIndex: draft.outcomeIndex,
        amount: parseVolume(draft.volume),
      });
      continue;
    }

    const sellAmount = parseVolume(draft.volume);
    const existingBalance = draft.outcomeIndex === 0 ? balances.outcome0 : balances.outcome1;

    if (existingBalance >= sellAmount) {
      legs.push({
        kind: "sell",
        outcomeIndex: draft.outcomeIndex,
        amount: sellAmount,
      });
      continue;
    }

    const deficit = sellAmount - existingBalance;
    const splitAmount = deficit <= remainingCollateral ? deficit : remainingCollateral;

    if (splitAmount > 0n) {
      legs.push({
        kind: "split",
        outcomeIndex: draft.outcomeIndex,
        amount: splitAmount,
      });
      remainingCollateral -= splitAmount;
    }

    if (deficit > splitAmount) {
      missingCollateralForInventory += deficit - splitAmount;
    }

    const achievableSell = existingBalance + splitAmount;
    if (achievableSell > 0n) {
      legs.push({
        kind: "sell",
        outcomeIndex: draft.outcomeIndex,
        amount: achievableSell > sellAmount ? sellAmount : achievableSell,
      });
    }
  }

  return { legs: orderLegs(legs), missingCollateralForInventory };
}

function estimateSequentialNetSpend(legs: FillToEstimateLeg[], currentOdds: number[]): bigint {
  let net = 0n;

  for (const leg of orderLegs(legs)) {
    const volume = Number(leg.amount) / 1e18;
    const price = getOutcomePrice(currentOdds, leg.outcomeIndex);

    if (leg.kind === "split") {
      net += leg.amount;
      continue;
    }

    const collateralDelta = parseVolume(volume * price);
    if (leg.kind === "sell") {
      net -= collateralDelta;
    } else {
      net += collateralDelta;
    }
  }

  return net > 0n ? net : 0n;
}

/** Peak wallet drawdown during split → sell → buy execution. */
export function estimatePeakCollateralUse(
  legs: FillToEstimateLeg[],
  currentOdds: number[],
  startingBalance: bigint,
): bigint {
  let available = startingBalance;
  let minAvailable = startingBalance;

  for (const leg of orderLegs(legs)) {
    if (leg.kind === "split") {
      available -= leg.amount;
    } else {
      const volume = Number(leg.amount) / 1e18;
      const price = getOutcomePrice(currentOdds, leg.outcomeIndex);
      const collateralDelta = parseVolume(volume * price);
      if (leg.kind === "sell") {
        available += collateralDelta;
      } else {
        available -= collateralDelta;
      }
    }

    if (available < minAvailable) {
      minAvailable = available;
    }
  }

  const peakUse = startingBalance - minAvailable;
  return peakUse > 0n ? peakUse : 0n;
}

export function buildFillToEstimateLegEstimates(
  legs: FillToEstimateLeg[],
  currentOdds: number[],
): FillToEstimateLegEstimate[] {
  return orderLegs(legs).map((leg) => {
    if (leg.kind === "split") {
      return { leg, estimatedSpend: leg.amount };
    }

    const volume = Number(leg.amount) / 1e18;
    const price = getOutcomePrice(currentOdds, leg.outcomeIndex);
    const collateralAmount = parseVolume(volume * price);

    if (leg.kind === "sell") {
      return { leg, estimatedProceeds: collateralAmount };
    }

    return { leg, estimatedSpend: collateralAmount };
  });
}

function scaleLegs(legs: FillToEstimateLeg[], scale: number): FillToEstimateLeg[] {
  if (scale >= 1) {
    return legs;
  }
  return orderLegs(
    legs
      .map((leg) => ({
        ...leg,
        amount: parseUnits(((Number(leg.amount) / 1e18) * scale).toFixed(18), 18),
      }))
      .filter((leg) => leg.amount > 0n),
  );
}

function getPoolsTouchedFromLegs(legs: FillToEstimateLeg[]): (0 | 1)[] {
  return [...new Set(legs.filter((leg) => leg.kind !== "split").map((leg) => leg.outcomeIndex))];
}

function simulateAchievableEstimate(
  market: Market,
  currentOdds: number[],
  legs: FillToEstimateLeg[],
  pools: [FillToEstimatePoolData | undefined, FillToEstimatePoolData | undefined],
): number {
  const simulatedPrices: [number, number] = [getOutcomePrice(currentOdds, 0), getOutcomePrice(currentOdds, 1)];

  for (const leg of orderLegs(legs)) {
    if (leg.kind === "split") {
      continue;
    }

    const pool = pools[leg.outcomeIndex];
    if (!pool) {
      continue;
    }

    const volume = Number(leg.amount) / 1e18;
    if (volume <= 0) {
      continue;
    }

    const newPrice = getPriceFromVolume(pool.pool, pool.ticks, volume, pool.outcomeAddress, leg.kind);
    simulatedPrices[leg.outcomeIndex] = newPrice;
  }

  return simulateEstimateFromPrices(simulatedPrices, market);
}

export function isFillToEstimateEnabled(market: Market): boolean {
  return market.type === "Generic" && getMarketType(market) === MarketTypes.SCALAR;
}

export function buildFillToEstimatePlan(params: BuildFillToEstimatePlanParams): FillToEstimatePlan {
  const { market, targetEstimate, currentOdds, balances, pools, maxCollateralToUse } = params;

  const emptyPlan = (error: string): FillToEstimatePlan => ({
    targetEstimate,
    currentEstimate: 0,
    achievableEstimate: 0,
    idealNetSpend: 0n,
    idealPeakCollateralUse: 0n,
    estimatedNetSpend: 0n,
    estimatedPeakCollateralUse: 0n,
    userMaxCollateralToUse: maxCollateralToUse ?? 0n,
    isBudgetConstrained: false,
    isTargetConstrained: false,
    isPartial: false,
    legs: [],
    legEstimates: [],
    poolsTouched: [],
    error,
  });

  if (!isFillToEstimateEnabled(market)) {
    return emptyPlan("Fill-to-estimate is only available for Generic scalar markets");
  }

  const currentEstimate = getCurrentEstimateFromOdds(currentOdds, market);
  if (currentEstimate === null) {
    return emptyPlan("Current market estimate is unavailable");
  }

  if (isEstimateReached(currentEstimate, targetEstimate)) {
    return {
      targetEstimate,
      currentEstimate,
      achievableEstimate: currentEstimate,
      idealNetSpend: 0n,
      idealPeakCollateralUse: 0n,
      estimatedNetSpend: 0n,
      estimatedPeakCollateralUse: 0n,
      userMaxCollateralToUse: maxCollateralToUse ?? 0n,
      isBudgetConstrained: false,
      isTargetConstrained: false,
      isPartial: false,
      legs: [],
      legEstimates: [],
      poolsTouched: [],
    };
  }

  const { legs: draftLegs, error } = buildDraftSwapLegs(market, targetEstimate, currentOdds, pools);
  if (error) {
    return emptyPlan(error);
  }

  const inventoryCap = getInventoryCollateralCap(balances, maxCollateralToUse);
  const { legs: idealLegs, missingCollateralForInventory } = appendInventoryLegs(draftLegs, balances, inventoryCap);
  const idealNetSpend = estimateSequentialNetSpend(idealLegs, currentOdds);
  const idealPeakCollateralUse = estimatePeakCollateralUse(idealLegs, currentOdds, balances.collateral);

  let finalLegs = idealLegs;
  const isBudgetConstrained = false;
  let scaledForBudget = false;

  if (maxCollateralToUse !== undefined) {
    let estimatedPeakCollateralUse = estimatePeakCollateralUse(finalLegs, currentOdds, balances.collateral);
    let estimatedNetSpend = estimateSequentialNetSpend(finalLegs, currentOdds);

    if (estimatedPeakCollateralUse > maxCollateralToUse && estimatedPeakCollateralUse > 0n) {
      const scale = Number(maxCollateralToUse) / Number(estimatedPeakCollateralUse);
      finalLegs = scaleLegs(finalLegs, scale);
      estimatedPeakCollateralUse = estimatePeakCollateralUse(finalLegs, currentOdds, balances.collateral);
      estimatedNetSpend = estimateSequentialNetSpend(finalLegs, currentOdds);
      scaledForBudget = true;
    }

    const achievableEstimate = simulateAchievableEstimate(market, currentOdds, finalLegs, pools);
    const targetReached = isEstimateReached(achievableEstimate, targetEstimate);
    const isTargetConstrained = !targetReached || missingCollateralForInventory > 0n;
    const isBudgetConstrained = scaledForBudget && !targetReached && missingCollateralForInventory === 0n;

    return {
      targetEstimate,
      currentEstimate,
      achievableEstimate,
      idealNetSpend,
      idealPeakCollateralUse,
      estimatedNetSpend,
      estimatedPeakCollateralUse,
      userMaxCollateralToUse: maxCollateralToUse,
      isBudgetConstrained,
      isTargetConstrained,
      isPartial: isBudgetConstrained || isTargetConstrained,
      legs: finalLegs,
      legEstimates: buildFillToEstimateLegEstimates(finalLegs, currentOdds),
      poolsTouched: getPoolsTouchedFromLegs(finalLegs),
      missingCollateralForInventory: missingCollateralForInventory > 0n ? missingCollateralForInventory : undefined,
    };
  }

  const estimatedNetSpend = estimateSequentialNetSpend(finalLegs, currentOdds);
  const estimatedPeakCollateralUse = estimatePeakCollateralUse(finalLegs, currentOdds, balances.collateral);
  const achievableEstimate = simulateAchievableEstimate(market, currentOdds, finalLegs, pools);
  const isTargetConstrained =
    !isEstimateReached(achievableEstimate, targetEstimate) || missingCollateralForInventory > 0n;

  return {
    targetEstimate,
    currentEstimate,
    achievableEstimate,
    idealNetSpend,
    idealPeakCollateralUse,
    estimatedNetSpend,
    estimatedPeakCollateralUse,
    userMaxCollateralToUse: maxCollateralToUse ?? idealPeakCollateralUse,
    isBudgetConstrained,
    isTargetConstrained,
    isPartial: isBudgetConstrained || isTargetConstrained,
    legs: finalLegs,
    legEstimates: buildFillToEstimateLegEstimates(finalLegs, currentOdds),
    poolsTouched: getPoolsTouchedFromLegs(finalLegs),
    missingCollateralForInventory: missingCollateralForInventory > 0n ? missingCollateralForInventory : undefined,
  };
}

export function getNormalizedTradeableOdds(currentOdds: number[]): number[] {
  return normalizeOdds([currentOdds[0] / 100, currentOdds[1] / 100]);
}

export function getEstimateFromNormalizedOdds(odds: number[], market: Market): number | null {
  const estimate = getMarketEstimate(odds, market);
  return typeof estimate === "number" ? estimate : null;
}
