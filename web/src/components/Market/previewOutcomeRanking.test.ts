import { expect, it } from "vitest";
import { rankPreviewOutcomes } from "./previewOutcomeRanking";
it("highlights No when it has the higher price", () => {
  const rows = rankPreviewOutcomes(["Yes", "No", "Invalid"], [30, 70, 99], "Invalid");
  expect(rows.map((r) => [r.name, r.leading])).toEqual([
    ["Yes", false],
    ["No", true],
  ]);
});
it("brings a leader outside the first two outcomes into view with its original token index", () => {
  const rows = rankPreviewOutcomes(["A", "B", "C", "D"], [10, 20, 60, 10], "Invalid");
  expect(rows.slice(0, 2).map((r) => [r.name, r.index, r.leading])).toEqual([
    ["C", 2, true],
    ["B", 1, false],
  ]);
});
it("handles missing data and equal leaders without picking an arbitrary favourite", () => {
  expect(rankPreviewOutcomes(["A", "B"], [null, Number.NaN], "Invalid").some((r) => r.leading)).toBe(false);
  expect(rankPreviewOutcomes(["A", "B", "C"], [40, 40, 20], "Invalid").map((r) => r.leading)).toEqual([
    true,
    true,
    false,
  ]);
});

it("keeps Yes first regardless of source order, whitespace or changing prices", () => {
  for (const prices of [
    [70, 30],
    [20, 80],
  ]) {
    const rows = rankPreviewOutcomes(["No ", "Yes"], prices, "Invalid");
    expect(rows.map((r) => r.index)).toEqual([1, 0]);
    expect(rows.find((r) => r.leading)?.price).toBe(Math.max(...prices));
  }
});
