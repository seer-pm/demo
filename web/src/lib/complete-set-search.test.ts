import { searchMinimalAmountForTargetNetOut } from "@seer-pm/sdk";
import { describe, expect, it } from "vitest";

/** netOut(amount) = amount - floor(amount / 4) — monotonic, needs ~4/3 of desiredOut at minimum. */
function linearBuyCostEvaluator(buyCostNumerator: bigint, buyCostDenominator: bigint) {
  return async (amount: bigint) => {
    if (amount <= 0n) {
      return undefined;
    }
    const buyCost = (amount * buyCostNumerator) / buyCostDenominator;
    const netOut = amount > buyCost ? amount - buyCost : 0n;
    return { netOut, payload: buyCost };
  };
}

describe("searchMinimalAmountForTargetNetOut", () => {
  it("finds minimal amount when initial guess is too low", async () => {
    const desiredOut = 100n;
    const evaluate = linearBuyCostEvaluator(1n, 4n);

    const result = await searchMinimalAmountForTargetNetOut({
      desiredOut,
      initialGuess: desiredOut,
      evaluate,
    });

    expect(result).toBeDefined();
    expect(result!.netOut).toBeGreaterThanOrEqual(desiredOut);
    const lower = await evaluate(result!.amount - 1n);
    expect(lower?.netOut ?? 0n).toBeLessThan(desiredOut);
  });

  it("finds minimal amount when initial guess already satisfies target", async () => {
    const desiredOut = 50n;
    const evaluate = linearBuyCostEvaluator(1n, 10n);

    const result = await searchMinimalAmountForTargetNetOut({
      desiredOut,
      initialGuess: 100n,
      evaluate,
    });

    expect(result).toBeDefined();
    expect(result!.amount).toBeLessThan(100n);
    expect(result!.netOut).toBeGreaterThanOrEqual(desiredOut);
  });

  it("returns undefined when no feasible upper bound exists within exponential steps", async () => {
    const evaluate = async (amount: bigint) => {
      if (amount <= 0n) {
        return undefined;
      }
      return { netOut: 1n, payload: amount };
    };

    const result = await searchMinimalAmountForTargetNetOut({
      desiredOut: 1_000_000n,
      initialGuess: 1n,
      evaluate,
      maxExponentialSteps: 4,
    });

    expect(result).toBeUndefined();
  });
});
