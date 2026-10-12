type Level = { price: number; shares: number };

/** Accumulate each side from its best price before arranging the visible ladder. */
export function cumulativeCostRows(levels: Level[], side: "sell" | "buy") {
  let total = 0;
  const rows = levels
    .filter(({ price, shares }) => Number.isFinite(price) && price >= 0 && Number.isFinite(shares) && shares > 0)
    .sort((a, b) => (side === "sell" ? a.price - b.price : b.price - a.price))
    .map((level, index) => {
      total += level.price * level.shares;
      return {
        ...level,
        id: `${side}-${index}`,
        side,
        total,
        pct: 0,
      };
    });
  for (const row of rows) row.pct = total > 0 ? row.total / total : 0;
  return side === "sell" ? rows.reverse() : rows;
}
