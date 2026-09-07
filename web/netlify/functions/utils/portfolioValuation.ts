import type { PortfolioPosition } from "@seer-pm/sdk";

/**
 * Outcome tokens the row represents: held in the wallet plus held inside an AMM position.
 *
 * `tokenBalance` is the wallet's ERC20 balance and stays that — the redeem and merge flows, and the
 * P/L path's balance rollback through `tokens_transfers`, all mean exactly that. Tokens sitting in a
 * concentrated-liquidity position are just as much the wallet's, and `enrichPositionsWithTokenValues`
 * already prices the row on the total, so every aggregate over the same rows has to agree with it or
 * the value card contradicts the positions tab it sits above.
 *
 * `lpTokenBalance` is absent on rows built without an LP source (the whole P/L path, and blobs
 * written before it existed), where it reads as zero and this is the balance it always was.
 */
export function positionTotalBalance(position: PortfolioPosition): number {
  return position.tokenBalance + (position.lpTokenBalance ?? 0);
}

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
  return groupByMarket(positions, (p) => p.tokenPrice * positionTotalBalance(p));
}

/** Mark-to-market per market id at `referenceTimeSeconds`, using the same rules as the scalar sum. */
export function groupPortfolioValueAtReferenceByMarket(
  positions: PortfolioPosition[],
  tokenIdToReferencePrice: Record<string, number | undefined>,
  referenceTimeSeconds: number,
): Map<string, number> {
  return groupByMarket(
    positions,
    (p) => positionPriceAtReference(p, tokenIdToReferencePrice, referenceTimeSeconds) * positionTotalBalance(p),
  );
}

export function sumPortfolioValueCurrent(positions: PortfolioPosition[]): number {
  return positions.reduce((acc, curr) => acc + curr.tokenPrice * positionTotalBalance(curr), 0);
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
      acc + positionPriceAtReference(curr, tokenIdToReferencePrice, referenceTimeSeconds) * positionTotalBalance(curr),
    0,
  );
}
