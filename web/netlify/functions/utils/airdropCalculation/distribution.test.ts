import { describe, expect, it } from "vitest";
import {
  type ChainUsers,
  POOL_SHARE_FACTOR,
  SEER_PER_DAY,
  createAccumulator,
  finalizeDistribution,
  foldChainUsersIntoAccumulator,
} from "./distribution";
import type { PoHRequest } from "./getPOHVerifiedUsers";

const TS = 1_000_000;

function poh(...addresses: string[]): PoHRequest[] {
  return addresses.map((requester, i) => ({ id: String(i), requester, resolutionTime: "0" }));
}

function chainUsers(chainId: number, holdings: Record<string, number>): ChainUsers {
  return Object.fromEntries(
    Object.entries(holdings).map(([address, direct]) => [
      address,
      { directHolding: direct, indirectHolding: 0, chainId },
    ]),
  );
}

function distribute(chains: ChainUsers[], pohUsers: string[] = []) {
  const acc = createAccumulator();
  for (const users of chains) {
    foldChainUsersIntoAccumulator(acc, users);
  }
  return finalizeDistribution(acc, poh(...pohUsers), [], TS);
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

describe("finalizeDistribution", () => {
  it("makes holdings shares sum to 1", () => {
    const records = distribute([chainUsers(100, { a: 10, b: 30, c: 60 })]);
    expect(sum(records.map((r) => r.shareOfHolding))).toBeCloseTo(1, 12);
  });

  it("makes PoH shares sum to 1 when anyone is verified", () => {
    const records = distribute([chainUsers(100, { a: 10, b: 30, c: 60 })], ["a", "c"]);
    expect(sum(records.map((r) => r.shareOfHoldingPoh))).toBeCloseTo(1, 12);
  });

  it("leaves PoH shares at 0 when nobody is verified", () => {
    const records = distribute([chainUsers(100, { a: 10, b: 30 })]);
    expect(sum(records.map((r) => r.shareOfHoldingPoh))).toBe(0);
  });

  it("keeps PoH shares summing to 1 for multi-chain holders", () => {
    // THE REGRESSION TEST. The old code accumulated sqrt(per-chain holding) into the denominator
    // while the numerator used sqrt(cross-chain total). Since sqrt(a) + sqrt(b) > sqrt(a + b), the
    // denominator was inflated and these shares summed to LESS than 1.
    const records = distribute([chainUsers(100, { a: 50, b: 40 }), chainUsers(1, { a: 50, c: 10 })], ["a", "b", "c"]);
    expect(sum(records.map((r) => r.shareOfHoldingPoh))).toBeCloseTo(1, 12);
  });

  it("uses sqrt of the cross-chain total, not the sum of per-chain sqrts", () => {
    // `a` holds 50 on each of two chains. Its PoH weight must be sqrt(100) = 10, not
    // sqrt(50) + sqrt(50) = 14.14.
    const records = distribute([chainUsers(100, { a: 50 }), chainUsers(1, { a: 50 })], ["a"]);
    expect(records).toHaveLength(1);
    expect(records[0].totalHolding).toBe(100);
    // Sole PoH holder takes the whole pool.
    expect(records[0].shareOfHoldingPoh).toBeCloseTo(1, 12);
  });

  it("merges a holder's chains and records every chain id", () => {
    const records = distribute([chainUsers(100, { a: 50 }), chainUsers(10, { a: 25 })]);
    expect(records[0].totalHolding).toBe(75);
    expect(records[0].chainIds.sort()).toEqual([10, 100]);
  });

  it("excludes dust from the payout AND from both denominators", () => {
    // The old toLocaleString test dropped sub-0.0005 holders from the payout while still counting
    // them in the denominators, so the shares no longer summed to 1.
    const records = distribute([chainUsers(100, { a: 10, dust: 1e-12 })], ["a"]);
    expect(records.map((r) => r.address)).toEqual(["a"]);
    expect(records[0].shareOfHolding).toBeCloseTo(1, 12);
    expect(records[0].shareOfHoldingPoh).toBeCloseTo(1, 12);
  });

  it("splits the holdings pool in proportion to holdings", () => {
    const records = distribute([chainUsers(100, { a: 25, b: 75 })]);
    const byAddress = Object.fromEntries(records.map((r) => [r.address, r]));
    expect(byAddress.a.shareOfHolding).toBeCloseTo(0.25, 12);
    expect(byAddress.b.shareOfHolding).toBeCloseTo(0.75, 12);
  });

  it("compresses the PoH pool by sqrt relative to the linear pool", () => {
    // Quadratic-funding weighting: the smaller holder's PoH share exceeds its holdings share.
    const records = distribute([chainUsers(100, { small: 1, big: 100 })], ["small", "big"]);
    const byAddress = Object.fromEntries(records.map((r) => [r.address, r]));
    expect(byAddress.small.shareOfHoldingPoh).toBeGreaterThan(byAddress.small.shareOfHolding);
    expect(byAddress.big.shareOfHoldingPoh).toBeLessThan(byAddress.big.shareOfHolding);
  });

  it("emits at most one day of SEER across both pools", () => {
    const records = distribute([chainUsers(100, { a: 10, b: 30, c: 60 })], ["a", "b", "c"]);
    expect(sum(records.map((r) => r.seerTokens))).toBeCloseTo(SEER_PER_DAY * 2 * POOL_SHARE_FACTOR, 6);
  });

  it("returns nothing when every holder is dust", () => {
    expect(distribute([chainUsers(100, { a: 0, b: 1e-15 })])).toEqual([]);
  });
});
