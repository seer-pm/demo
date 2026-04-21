import type { PortfolioPosition } from "@seer-pm/sdk";

export function sumPortfolioValueCurrent(positions: PortfolioPosition[]): number {
  return positions.reduce((acc, curr) => acc + curr.tokenPrice * curr.tokenBalance, 0);
}

/**
 * history price with fallback to current (`positions[].tokenPrice`);
 * if market was finalized before `referenceTime`, use redeemed price.
 */
export function sumPortfolioValueAtReference(
  positions: PortfolioPosition[],
  tokenIdToReferencePrice: Record<string, number | undefined>,
  referenceTimeSeconds: number,
): number {
  return positions.reduce((acc, curr) => {
    let tokenPrice = tokenIdToReferencePrice[curr.tokenId.toLowerCase()] ?? curr.tokenPrice;
    if (curr.marketFinalizeTs < referenceTimeSeconds) {
      tokenPrice = curr.redeemedPrice || tokenPrice;
    }
    return acc + tokenPrice * curr.tokenBalance;
  }, 0);
}
