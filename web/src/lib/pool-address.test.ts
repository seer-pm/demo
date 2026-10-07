import { POOL_FACTORY_ADDRESSES, computePoolAddress, getComputedPoolAddressesForMarket } from "@seer-pm/sdk";
import type { Market } from "@seer-pm/sdk";
import { type Address, zeroAddress } from "viem";
import { gnosis } from "viem/chains";
import { describe, expect, it } from "vitest";

const SDAI = "0xaf204776c7245bf4147c2612bf6e5972ee483701" as Address;
const ROOT_YES = "0x1111000000000000000000000000000000000001" as Address;
const ROOT_OTHER = "0x1111000000000000000000000000000000000002" as Address;
const CHILD_A = "0x2222000000000000000000000000000000000001" as Address;
const CHILD_OTHER = "0x2222000000000000000000000000000000000002" as Address;

function market(id: string, wrappedTokens: Address[], parentMarketId: Address, collateralToken: Address): Market {
  return {
    id,
    chainId: gnosis.id,
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
const SDAI_CHILD = market("0xsdaichild", [CHILD_A, CHILD_OTHER], ROOT.id as Address, SDAI);

const poolOf = (tokenA: Address, tokenB: Address) =>
  computePoolAddress({ factoryAddress: POOL_FACTORY_ADDRESSES[gnosis.id]!, tokenA, tokenB }).toLowerCase();

describe("getComputedPoolAddressesForMarket", () => {
  it("derives one pool per outcome for a top-level market", () => {
    expect(getComputedPoolAddressesForMarket(ROOT)).toEqual([poolOf(ROOT_YES, SDAI), poolOf(ROOT_OTHER, SDAI)]);
  });

  it("adds the main collateral pool of every child outcome next to its parent pool", () => {
    expect(getComputedPoolAddressesForMarket(CHILD)).toEqual([
      poolOf(CHILD_A, ROOT_OTHER),
      poolOf(CHILD_A, SDAI),
      poolOf(CHILD_OTHER, ROOT_OTHER),
      poolOf(CHILD_OTHER, SDAI),
    ]);
  });

  it("does not list the collateral pool twice when a child already settles in the main collateral", () => {
    expect(getComputedPoolAddressesForMarket(SDAI_CHILD)).toEqual([poolOf(CHILD_A, SDAI), poolOf(CHILD_OTHER, SDAI)]);
  });

  it("is empty on a chain without a known factory", () => {
    expect(getComputedPoolAddressesForMarket({ ...ROOT, chainId: 999 } as unknown as Market)).toEqual([]);
  });
});
