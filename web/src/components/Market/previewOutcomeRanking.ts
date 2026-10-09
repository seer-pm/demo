/** Binary rows keep Yes above No; categorical rows rank by price. A tie at the top has no leader, so a 50/50 market does not highlight both sides. */
export function rankPreviewOutcomes(names: readonly string[], prices: readonly (number | null)[], invalidName: string) {
  const outcomes = names
    .map((name, index) => ({ name, index, price: prices[index] }))
    .filter(({ name }) => name !== invalidName);
  const validPrice = (price: number | null | undefined): price is number =>
    typeof price === "number" && Number.isFinite(price) && price >= 0;
  const knownPrices = outcomes.filter((o) => validPrice(o.price)).map((o) => o.price as number);
  const highest = Math.max(Number.NEGATIVE_INFINITY, ...knownPrices);
  const uniqueLeader = knownPrices.filter((price) => price === highest).length === 1;
  const binary =
    outcomes.length === 2 &&
    outcomes.some((o) => o.name.trim().toLowerCase() === "yes") &&
    outcomes.some((o) => o.name.trim().toLowerCase() === "no");
  return outcomes
    .sort((a, b) =>
      binary
        ? Number(a.name.trim().toLowerCase() !== "yes") - Number(b.name.trim().toLowerCase() !== "yes")
        : (validPrice(b.price) ? b.price : Number.NEGATIVE_INFINITY) -
            (validPrice(a.price) ? a.price : Number.NEGATIVE_INFINITY) || a.index - b.index,
    )
    .map((o) => ({ ...o, leading: uniqueLeader && validPrice(o.price) && o.price === highest }));
}
