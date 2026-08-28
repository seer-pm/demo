import type { PortfolioPosition } from "@seer-pm/sdk";

/** Price of one position at `referenceTime`: history price, else current, else redeemed if settled. */
function positionPriceAtReference(
  position: PortfolioPosition,
  tokenIdToReferencePrice: Record<string, number | undefined>,
  referenceTimeSeconds: number,
): number {
  const tokenPrice = tokenIdToReferencePrice[position.tokenId.toLowerCase()] ?? position.tokenPrice;
  if (position.marketFinalizeTs < referenceTimeSeconds) {
    return position.redeemedPrice || tokenPrice;
  }
  return tokenPrice;
}

function groupByMarket(positions: PortfolioPosition[], value: (p: PortfolioPosition) => number): Map<string, number> {
  const byMarket = new Map<string, number>();
  for (const position of positions) {
    const marketId = position.marketId.toLowerCase();
    byMarket.set(marketId, (byMarket.get(marketId) ?? 0) + value(position));
  }
  return byMarket;
}

/**
 * Current mark-to-market per market id.
 *
 * The per-market split is what makes P/L additive: every position already carries `marketId`, so
 * valuation needs no extra data source to be bucketed.
 */
export function groupPortfolioValueCurrentByMarket(positions: PortfolioPosition[]): Map<string, number> {
  return groupByMarket(positions, (p) => p.tokenPrice * p.tokenBalance);
}

/** Mark-to-market per market id at `referenceTimeSeconds`, using the same rules as the scalar sum. */
export function groupPortfolioValueAtReferenceByMarket(
  positions: PortfolioPosition[],
  tokenIdToReferencePrice: Record<string, number | undefined>,
  referenceTimeSeconds: number,
): Map<string, number> {
  return groupByMarket(
    positions,
    (p) => positionPriceAtReference(p, tokenIdToReferencePrice, referenceTimeSeconds) * p.tokenBalance,
  );
}

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
  return positions.reduce(
    (acc, curr) =>
      acc + positionPriceAtReference(curr, tokenIdToReferencePrice, referenceTimeSeconds) * curr.tokenBalance,
    0,
  );
}
