import type { FillToEstimateLegEstimate, Market, Token } from "@seer-pm/sdk";
import { getMarketEstimate } from "@seer-pm/sdk";
import { formatUnits } from "viem";
import { displayNumber } from "./utils";

export function formatCurrentEstimate(odds: (number | null)[], market: Market): string {
  const estimate = getMarketEstimate(odds, market, true);
  return typeof estimate === "string" ? estimate : String(estimate);
}

function formatCollateralAmount(amount: bigint, collateral: Token): string {
  return `${displayNumber(Number(formatUnits(amount, collateral.decimals)), 2)} ${collateral.symbol}`;
}

export function formatFillToEstimateLegPreview(
  estimate: FillToEstimateLegEstimate,
  index: number,
  market: Market,
  collateral: Token,
): string {
  const { leg, estimatedSpend, estimatedProceeds } = estimate;
  const tokenDecimals = leg.kind === "split" ? collateral.decimals : 18;
  const tokenAmount = displayNumber(Number(formatUnits(leg.amount, tokenDecimals)), 2);
  const outcome = market.outcomes[leg.outcomeIndex];
  const step = index + 1;

  if (leg.kind === "split") {
    return `${step}. Split ${tokenAmount} ${collateral.symbol}`;
  }

  if (leg.kind === "sell") {
    const proceeds =
      estimatedProceeds !== undefined ? ` → recover ~${formatCollateralAmount(estimatedProceeds, collateral)}` : "";
    return `${step}. Sell ${tokenAmount} ${outcome}${proceeds}`;
  }

  const cost = estimatedSpend !== undefined ? ` (~${formatCollateralAmount(estimatedSpend, collateral)})` : "";
  return `${step}. Buy ${tokenAmount} ${outcome}${cost}`;
}
