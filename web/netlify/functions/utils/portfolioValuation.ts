import type { PortfolioPosition } from "@seer-pm/sdk";

export function sumPortfolioValueCurrent(
  positions: PortfolioPosition[],
  tokenIdToCurrentPrice: Record<string, number | undefined>,
): number {
  return positions.reduce((acc, curr) => {
    let tokenPrice = tokenIdToCurrentPrice[curr.tokenId.toLowerCase()] ?? 0;
    tokenPrice = curr.redeemedPrice || tokenPrice;
    return acc + tokenPrice * curr.tokenBalance;
  }, 0);
}

/**
 * history price with fallback to current; if market was finalized before `referenceTime`, use redeemed price.
 */
export function sumPortfolioValueAtReference(
  positions: PortfolioPosition[],
  tokenIdToReferencePrice: Record<string, number | undefined>,
  tokenIdToCurrentPrice: Record<string, number | undefined>,
  referenceTimeSeconds: number,
): number {
  return positions.reduce((acc, curr) => {
    let tokenPrice =
      tokenIdToReferencePrice[curr.tokenId.toLowerCase()] ?? tokenIdToCurrentPrice[curr.tokenId.toLowerCase()] ?? 0;
    if (curr.marketFinalizeTs < referenceTimeSeconds) {
      tokenPrice = curr.redeemedPrice || tokenPrice;
    }
    return acc + tokenPrice * curr.tokenBalance;
  }, 0);
}

export function enrichPositionsWithTokenValues(
  positions: PortfolioPosition[],
  tokenIdToCurrentPrice: Record<string, number | undefined>,
): PortfolioPosition[] {
  return positions.map((position) => {
    const tokenPrice = position.redeemedPrice || tokenIdToCurrentPrice[position.tokenId.toLowerCase()];
    return {
      ...position,
      tokenPrice,
      tokenValue: tokenPrice !== undefined ? tokenPrice * position.tokenBalance : undefined,
    };
  });
}
