import { type Market, getOutcomeSwapCollaterals, getToken0Token1 } from "@seer-pm/sdk";
import { type Address, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

const GNOSIS = 100;
const SDAI = "0xaf204776c7245bf4147c2612bf6e5972ee483701" as Address;

const ROOT_YES = "0x1111000000000000000000000000000000000001" as Address;
const ROOT_OTHER = "0x1111000000000000000000000000000000000002" as Address;
const CHILD_A = "0x2222000000000000000000000000000000000001" as Address;
const CHILD_OTHER = "0x2222000000000000000000000000000000000002" as Address;

function market(id: string, wrappedTokens: Address[], parentMarketId: Address, collateralToken: Address): Market {
  return {
    id,
    chainId: GNOSIS,
    type: "Generic",
    wrappedTokens,
    collateralToken,
    collateralToken1: zeroAddress,
    collateralToken2: zeroAddress,
    parentMarket: { id: parentMarketId },
  } as unknown as Market;
}

const ROOT = market("0xroot", [ROOT_YES, ROOT_OTHER], zeroAddress, SDAI);
const CHILD = market("0xchild", [CHILD_A, CHILD_OTHER], ROOT.id as Address, ROOT_OTHER);
// A child funded directly in the main collateral has a single pair per outcome.
const CHILD_ON_SDAI = market("0xchild-sdai", [CHILD_A, CHILD_OTHER], ROOT.id as Address, SDAI);

function pool(outcome: Address, counterparty: Address, liquidity: bigint) {
  return { ...getToken0Token1(outcome, counterparty), liquidity };
}

describe("getOutcomeSwapCollaterals", () => {
  it("offers only the market collateral on a root market", () => {
    expect(getOutcomeSwapCollaterals(ROOT, 0, [pool(ROOT_YES, SDAI, 10n)])).toEqual({
      options: [SDAI],
      defaultCollateral: SDAI,
    });
  });

  it("offers the main collateral too when both pools hold liquidity, parent first", () => {
    const pools = [pool(CHILD_A, ROOT_OTHER, 5n), pool(CHILD_A, SDAI, 7n)];
    expect(getOutcomeSwapCollaterals(CHILD, 0, pools)).toEqual({
      options: [ROOT_OTHER, SDAI],
      defaultCollateral: ROOT_OTHER,
    });
  });

  it("defaults to the main collateral when only its pool holds liquidity", () => {
    expect(getOutcomeSwapCollaterals(CHILD, 0, [pool(CHILD_A, SDAI, 7n)])).toEqual({
      options: [ROOT_OTHER, SDAI],
      defaultCollateral: SDAI,
    });
  });

  it("keeps the parent token as default when no pool holds liquidity", () => {
    expect(getOutcomeSwapCollaterals(CHILD, 0, [pool(CHILD_A, ROOT_OTHER, 0n)])).toEqual({
      options: [ROOT_OTHER],
      defaultCollateral: ROOT_OTHER,
    });
  });

  it("hides the main collateral when its pool is empty", () => {
    const pools = [pool(CHILD_A, ROOT_OTHER, 5n), pool(CHILD_A, SDAI, 0n)];
    expect(getOutcomeSwapCollaterals(CHILD, 0, pools)).toEqual({
      options: [ROOT_OTHER],
      defaultCollateral: ROOT_OTHER,
    });
  });

  it("takes the deepest pool of a pair when several exist", () => {
    const pools = [pool(CHILD_A, SDAI, 0n), pool(CHILD_A, SDAI, 3n)];
    expect(getOutcomeSwapCollaterals(CHILD, 0, pools).options).toEqual([ROOT_OTHER, SDAI]);
  });

  it("ignores pools of other outcomes", () => {
    expect(getOutcomeSwapCollaterals(CHILD, 0, [pool(CHILD_OTHER, SDAI, 7n)]).options).toEqual([ROOT_OTHER]);
  });

  it("offers nothing extra when the child already uses the main collateral", () => {
    expect(getOutcomeSwapCollaterals(CHILD_ON_SDAI, 0, [pool(CHILD_A, SDAI, 7n)])).toEqual({
      options: [SDAI],
      defaultCollateral: SDAI,
    });
  });

  it("matches pool addresses regardless of case", () => {
    const upper = {
      token0: CHILD_A.toUpperCase().replace("0X", "0x") as Address,
      token1: SDAI.toUpperCase().replace("0X", "0x") as Address,
      liquidity: 1n,
    };
    expect(getOutcomeSwapCollaterals(CHILD, 0, [upper]).options).toEqual([ROOT_OTHER, SDAI]);
  });
});
