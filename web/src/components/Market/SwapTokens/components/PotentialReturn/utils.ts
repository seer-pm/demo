import { Market, MarketTypes, getMarketType, getMultiScalarEstimate } from "@/lib/market";
import { displayScalarBound } from "@/lib/reality";
import { Token } from "@/lib/tokens";
import { isUndefined } from "@/lib/utils";
import { PotentialReturnInputType } from "./interfaces";

export function getPotentialReturn(
  collateralPerShare: number,
  returnPerToken: number,
  isSecondaryCollateral: boolean,
  receivedAmount: number,
  sharesToAssets: number,
  assetsToShares: number,
  isOneOrNothingPotentialReturn: boolean,
) {
  const returnPercentage = collateralPerShare
    ? (returnPerToken / (collateralPerShare * (isSecondaryCollateral ? assetsToShares : 1)) - 1) * 100
    : 0;
  const potentialReturn =
    (isSecondaryCollateral ? receivedAmount * sharesToAssets : receivedAmount) *
    (isOneOrNothingPotentialReturn ? 1 : returnPerToken);

  return { returnPercentage, potentialReturn };
}

export function getScalarReturnPerToken(market: Market, outcomeTokenIndex: number, forecast: number) {
  const [lowerBound, upperBound] = [displayScalarBound(market.lowerBound), displayScalarBound(market.upperBound)];

  if (outcomeTokenIndex === 0) {
    // DOWN Token
    if (forecast <= lowerBound) {
      return 1;
    }

    if (forecast >= upperBound) {
      return 0;
    }
    return (upperBound - forecast) / (upperBound - lowerBound);
  }

  // UP Token
  if (forecast <= lowerBound) {
    return 0;
  }
  if (forecast >= upperBound) {
    return 1;
  }
  return (forecast - lowerBound) / (upperBound - lowerBound);
}

function getMultiCategoricalReturnPerToken(outcomeText: string, forecast: string[]) {
  if (!forecast.includes(outcomeText)) {
    return 0;
  }
  return forecast.length > 0 ? 1 / forecast.length : 1;
}

function getMultiScalarReturnPerToken(outcomeTokenIndex: number, forecast: number[]) {
  const sum = forecast.reduce((acc, curr) => acc + (curr ?? 0), 0);
  return sum ? (forecast[outcomeTokenIndex] ?? 0) / sum : 0;
}

export function getReturnPerToken(
  market: Market,
  outcomeToken: Token,
  outcomeText: string,
  input: PotentialReturnInputType,
) {
  const marketType = getMarketType(market);
  const outcomeTokenIndex = market.wrappedTokens.findIndex((x) => x === outcomeToken.address);

  if (marketType === MarketTypes.SCALAR) {
    if (!isUndefined(input.scalar)) {
      return getScalarReturnPerToken(market, outcomeTokenIndex, input.scalar);
    }
  }

  if (marketType === MarketTypes.MULTI_CATEGORICAL) {
    if (input.multiCategorical.length > 0) {
      return getMultiCategoricalReturnPerToken(outcomeText, input.multiCategorical);
    }
  }

  if (marketType === MarketTypes.MULTI_SCALAR) {
    if (input.multiScalar[outcomeTokenIndex]) {
      return getMultiScalarReturnPerToken(outcomeTokenIndex, input.multiScalar);
    }
  }

  return 1;
}

export function getDefaultInput(market: Market, outcomeToken: Token, outcomeText: string, odds: (number | null)[]) {
  const defaultValue = {
    multiCategorical: [],
    scalar: undefined,
    multiScalar: [],
  };

  const outcomeTokenIndex = market.wrappedTokens.findIndex((x) => x === outcomeToken.address);

  const marketType = getMarketType(market);

  if (marketType === MarketTypes.SCALAR) {
    if (outcomeTokenIndex === 0 || outcomeTokenIndex === 1) {
      return {
        ...defaultValue,
        scalar: Number(outcomeTokenIndex === 0 ? market.lowerBound : market.upperBound),
      };
    }
  }

  if (marketType === MarketTypes.MULTI_CATEGORICAL) {
    return {
      ...defaultValue,
      multiCategorical: [outcomeText],
    };
  }

  if (marketType === MarketTypes.MULTI_SCALAR) {
    const multiScalar = odds.map((odd) => {
      const estimate = getMultiScalarEstimate(market, odd);

      return estimate?.value || 0;
    });

    return {
      ...defaultValue,
      multiScalar,
    };
  }

  return defaultValue;
}
