import { Market, MarketTypes, getMarketType, getMarketUnit } from "@seer-pm/sdk";

/**
 * A scalar market charts its estimate in the market's own unit (the one in its name, e.g. "[gwei]"),
 * formatted like the header's Market Estimate. Every other market charts outcome probabilities.
 */
export function formatChartValue(market: Market, value: number, decimalPlaces: number) {
  if (getMarketType(market) === MarketTypes.SCALAR) {
    const unit = getMarketUnit(market);
    return unit ? `${value.toLocaleString()} ${unit}` : value.toLocaleString();
  }
  return value % 1 === 0 ? `${value}%` : `${value.toFixed(decimalPlaces)}%`;
}
