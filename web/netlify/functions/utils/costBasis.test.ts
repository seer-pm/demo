import { describe, expect, it } from "vitest";
import { type BasisEvent, foldCostBasis, foldCostBasisLedger, splitWeights } from "./costBasis";

const YES = "0xyes";
const NO = "0xno";
const CHILD = "0xchild";
const PRIMARY = { kind: "primary" } as const;
const IN_YES = { kind: "token", tokenId: YES } as const;

/** `Omit` distributed over the union, so each event kind keeps its own fields. */
type EventBody = BasisEvent extends infer E ? (E extends BasisEvent ? Omit<E, "timestamp" | "seq"> : never) : never;

let seq = 0;
function at(timestamp: number, event: EventBody): BasisEvent {
  return { timestamp, seq: seq++, ...event } as BasisEvent;
}
const buy = (tokenId: string, amount: number, paid: number, t = 1) =>
  at(t, { kind: "swap", tokenId, tokenAmount: amount, collateralAmount: paid, collateral: PRIMARY });
const sell = (tokenId: string, amount: number, received: number, t = 2) =>
  at(t, { kind: "swap", tokenId, tokenAmount: -amount, collateralAmount: received, collateral: PRIMARY });

describe("splitWeights", () => {
  it("normalises pool prices to one", () => {
    expect(splitWeights(2, [0.9, 0.1])).toEqual({ weights: [0.9, 0.1], even: false });
    expect(splitWeights(2, [0.45, 0.45]).weights).toEqual([0.5, 0.5]);
  });
  it("falls back to 1/N without a usable price", () => {
    expect(splitWeights(3)).toEqual({ weights: [1 / 3, 1 / 3, 1 / 3], even: true });
    expect(splitWeights(2, [undefined, undefined]).even).toBe(true);
    expect(splitWeights(2, [0, 0]).weights).toEqual([0.5, 0.5]);
  });
  it("treats a missing price among known ones as zero weight", () => {
    expect(splitWeights(2, [0.8, undefined]).weights).toEqual([1, 0]);
  });
  it("uses the fallback weights when nothing is priced", () => {
    expect(splitWeights(3, undefined, [1, 1, 0])).toEqual({ weights: [0.5, 0.5, 0], even: true });
    expect(splitWeights(3, [0, 0, 0], [0, 0, 0]).weights).toEqual([1 / 3, 1 / 3, 1 / 3]);
  });
});

describe("foldCostBasis", () => {
  it("averages buys and realizes on a sale at the running average", () => {
    const basis = foldCostBasis([buy(YES, 100, 20, 1), buy(YES, 100, 40, 2), sell(YES, 50, 25, 3)]);
    const yes = basis.get(YES)!;
    expect(yes.quantity).toBe(150);
    expect(yes.averageCost).toBeCloseTo(0.3);
    expect(yes.cost).toBeCloseTo(45);
    expect(yes.realized).toBeCloseTo(25 - 15);
    expect(yes.totalBought).toBe(60);
    expect(yes.totalSold).toBe(25);
  });

  it("spec example 1: a split spreads cost by pool price, so selling the dear side leaves the cheap side flat", () => {
    const basis = foldCostBasis([
      at(1, { kind: "split", tokenIds: [YES, NO], amount: 100, collateral: PRIMARY, prices: [0.9, 0.1] }),
      sell(YES, 100, 88, 2),
    ]);
    expect(basis.get(YES)!.quantity).toBe(0);
    expect(basis.get(YES)!.realized).toBeCloseTo(-2);
    expect(basis.get(NO)!.averageCost).toBeCloseTo(0.1);
    expect(basis.get(NO)!.cost).toBeCloseTo(10);
  });

  it("spec example 2: paying with a parent outcome converts its cost to the child without realizing", () => {
    const basis = foldCostBasis([
      buy(YES, 200, 40, 1),
      at(2, { kind: "swap", tokenId: CHILD, tokenAmount: 100, collateralAmount: 100, collateral: IN_YES }),
    ]);
    expect(basis.get(CHILD)).toMatchObject({ quantity: 100, cost: 20, realized: 0 });
    expect(basis.get(CHILD)!.averageCost).toBeCloseTo(0.2);
    expect(basis.get(YES)).toMatchObject({ quantity: 100, cost: 20, realized: 0 });
  });

  it("selling a child for parent tokens hands the cost back to the parent instead of realizing", () => {
    const basis = foldCostBasis([
      buy(YES, 200, 40, 1),
      at(2, { kind: "swap", tokenId: CHILD, tokenAmount: 100, collateralAmount: 100, collateral: IN_YES }),
      at(3, { kind: "swap", tokenId: CHILD, tokenAmount: -100, collateralAmount: 150, collateral: IN_YES }),
    ]);
    expect(basis.get(CHILD)!.quantity).toBe(0);
    expect(basis.get(CHILD)!.realized).toBe(0);
    const yes = basis.get(YES)!;
    expect(yes.quantity).toBe(250);
    expect(yes.cost).toBeCloseTo(40);
    expect(yes.averageCost).toBeCloseTo(0.16);
  });

  it("a merge removes every outcome at its average and realizes against the collateral returned", () => {
    const basis = foldCostBasis([
      buy(YES, 100, 60, 1),
      buy(NO, 100, 30, 1),
      at(2, { kind: "merge", tokenIds: [YES, NO], amount: 100, collateral: PRIMARY }),
    ]);
    expect(basis.get(YES)!.quantity).toBe(0);
    expect(basis.get(NO)!.quantity).toBe(0);
    const realized = basis.get(YES)!.realized + basis.get(NO)!.realized;
    expect(realized).toBeCloseTo(100 - 90);
    // Spread by released cost: YES released 60 of 90, so it carries two thirds of gain and proceeds.
    expect(basis.get(YES)!.realized).toBeCloseTo(10 * (60 / 90));
    expect(basis.get(YES)!.totalSold).toBeCloseTo(100 * (60 / 90));
    expect(basis.get(NO)!.totalSold).toBeCloseTo(100 * (30 / 90));
  });

  it("a redeem realizes the payout, and a losing redeem realizes the whole cost", () => {
    const basis = foldCostBasis([
      buy(YES, 100, 60, 1),
      buy(NO, 100, 30, 1),
      at(2, { kind: "redeem", tokenId: YES, amount: 100, payout: 100, collateral: PRIMARY }),
      at(2, { kind: "redeem", tokenId: NO, amount: 100, payout: 0, collateral: PRIMARY }),
    ]);
    expect(basis.get(YES)!.realized).toBeCloseTo(40);
    expect(basis.get(NO)!.realized).toBeCloseTo(-30);
    expect(basis.get(NO)!.totalSold).toBe(0);
  });

  it("a transfer in enters at the given unit cost and does not count as bought", () => {
    const basis = foldCostBasis([
      buy(YES, 100, 20, 1),
      at(2, { kind: "transferIn", tokenId: YES, amount: 100, unitCost: 0.4 }),
    ]);
    const yes = basis.get(YES)!;
    expect(yes.quantity).toBe(200);
    expect(yes.averageCost).toBeCloseTo(0.3);
    expect(yes.totalBought).toBe(20);
  });

  it("a transfer out leaves at the average without realizing", () => {
    const basis = foldCostBasis([buy(YES, 100, 20, 1), at(2, { kind: "transferOut", tokenId: YES, amount: 40 })]);
    expect(basis.get(YES)).toMatchObject({ quantity: 60, realized: 0 });
    expect(basis.get(YES)!.cost).toBeCloseTo(12);
  });

  it("flags tokens minted by an evenly spread split", () => {
    const basis = foldCostBasis([at(1, { kind: "split", tokenIds: [YES, NO], amount: 10, collateral: PRIMARY })]);
    expect(basis.get(YES)).toMatchObject({ evenSplit: true, cost: 5 });
  });

  it("records the leaving average under the handoff key for the receiving wallet", () => {
    const ledger = foldCostBasisLedger([
      buy(YES, 100, 30, 1),
      at(2, { kind: "transferOut", tokenId: YES, amount: 40, handoffKey: "0xtx:7" }),
    ]);
    expect(ledger.handoffs.get("0xtx:7")).toBeCloseTo(0.3);
    expect(ledger.snapshot().get(YES)!.quantity).toBe(60);
  });

  it("marks LP-touched tokens while still folding their swaps", () => {
    const basis = foldCostBasis([buy(YES, 100, 20, 1), at(2, { kind: "lp", tokenId: YES })]);
    expect(basis.get(YES)).toMatchObject({ lpTouched: true, quantity: 100 });
  });

  it("never goes negative: an over-sale is removed at zero cost and flagged approximate", () => {
    const basis = foldCostBasis([buy(YES, 100, 20, 1), sell(YES, 150, 60, 2)]);
    const yes = basis.get(YES)!;
    expect(yes.quantity).toBe(0);
    expect(yes.approximate).toBe(true);
    expect(yes.realized).toBeCloseTo(60 - 20);
  });

  it("flags a child bought with parent tokens the fold never saw", () => {
    const basis = foldCostBasis([
      at(1, { kind: "swap", tokenId: CHILD, tokenAmount: 100, collateralAmount: 100, collateral: IN_YES }),
    ]);
    expect(basis.get(CHILD)).toMatchObject({ quantity: 100, cost: 0, approximate: true });
    expect(basis.get(YES)!.approximate).toBe(true);
  });

  it("folds in timestamp then seq order whatever the input order", () => {
    const events = [sell(YES, 50, 30, 5), buy(YES, 100, 20, 1)];
    const yes = foldCostBasis(events).get(YES)!;
    expect(yes.approximate).toBe(false);
    expect(yes.quantity).toBe(50);
  });

  it("clears float residue when a position is fully closed", () => {
    const basis = foldCostBasis([buy(YES, 0.3, 0.1, 1), sell(YES, 0.1, 0.05, 2), sell(YES, 0.2, 0.1, 3)]);
    expect(basis.get(YES)!.quantity).toBe(0);
    expect(basis.get(YES)!.cost).toBe(0);
    expect(basis.get(YES)!.averageCost).toBeUndefined();
  });
});
