import type { CompleteSetSplitStep } from "@seer-pm/sdk";

/**
 * Names the market a split step mints, for a list of steps ordered root first where the last one
 * is the market being traded. Ancestors are named by distance from it, since the questions are too
 * long to name the levels by. The phrase carries its article so it reads the same mid-sentence
 * ("a full set of the parent market") and in a row label ("split this market").
 */
export function getSplitStepMarketLabel(steps: CompleteSetSplitStep[], index: number): string {
  const distance = steps.length - 1 - index;
  if (distance === 0) {
    return "this market";
  }
  if (distance === 1) {
    return "the parent market";
  }
  if (distance === 2) {
    return "the grandparent market";
  }
  return `the parent market ${distance} levels up`;
}
