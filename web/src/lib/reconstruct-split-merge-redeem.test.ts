import { liquidityPoolTxKey, reconstructSplitMergeRedeemFromTransfers } from "@seer-pm/sdk";
import type { Market, Token, TokenTransfer } from "@seer-pm/sdk";
import { type Address, parseUnits, zeroAddress } from "viem";
import { gnosis } from "viem/chains";
import { describe, expect, it } from "vitest";

const addr = (suffix: string) => `0x${suffix.padStart(40, "0")}` as Address;

const YES = addr("a1");
const NO = addr("b1");
const SDAI = addr("c1");
const POOL = addr("f1");
const OTHER_POOL = addr("f2");
const ALICE = addr("1111");
const BOB = addr("2222");
const GNOSIS_ROUTER = "0xeC9048b59b3467415b1a38F63416407eA0c70fB8" as Address;
const TX = "0xtx1";

const sDai: Token = { address: SDAI, chainId: gnosis.id, symbol: "sDAI", decimals: 18 };

function market(): Market {
  return {
    id: addr("aa"),
    marketName: "Will it rain?",
    type: "Generic",
    chainId: gnosis.id,
    wrappedTokens: [YES, NO],
    collateralToken: SDAI,
    parentMarket: { id: zeroAddress, conditionId: "0x0", payoutReported: false, payoutNumerators: [] },
  } as unknown as Market;
}

let nextId = 0;
function transfer(token: Address, from: Address, to: Address, amount: string): TokenTransfer {
  nextId += 1;
  return {
    id: `transfer-${nextId}`,
    chain_id: gnosis.id,
    token,
    tx_hash: TX,
    log_index: nextId,
    block_number: 100,
    timestamp: 1_700_000_000,
    value: parseUnits(amount, 18),
    from,
    to,
  };
}

/**
 * `poolAddresses` is supplied so no case depends on a CREATE2 derivation.
 *
 * Every case passes outcome legs only: an AMM trade's collateral leg is not in `tokens_transfers`,
 * so the reconstruction never sees one for these transactions in production either.
 */
function classify(transfers: TokenTransfer[], liquidityPoolTxKeys: ReadonlySet<string> = new Set(), pools = [POOL]) {
  return reconstructSplitMergeRedeemFromTransfers(transfers, market(), sDai, {
    identifySwaps: true,
    poolAddresses: pools,
    liquidityPoolTxKeys,
  });
}

const liquidityOn = (pool: Address) => new Set([liquidityPoolTxKey(TX, pool)]);

describe("reconstructSplitMergeRedeemFromTransfers swap classification", () => {
  it("reports a deposit into the pool as an LP add, not a sale", () => {
    const rows = classify([transfer(YES, ALICE, POOL, "1000")], liquidityOn(POOL));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ type: "lp", trader: ALICE, outcomeToken: YES, amount: "1000" });
  });

  it("reports the same transfer as a sale when the pool minted no liquidity", () => {
    const rows = classify([transfer(YES, ALICE, POOL, "1000")]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ type: "sold", trader: ALICE, amount: "1000" });
  });

  it("reports a withdrawal as an LP burn, not a purchase", () => {
    const rows = classify([transfer(YES, POOL, ALICE, "1000")], liquidityOn(POOL));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ type: "lp-burn", trader: ALICE });
  });

  it("reports the same transfer as a purchase when the pool burned no liquidity", () => {
    expect(classify([transfer(YES, POOL, ALICE, "1000")])[0]).toMatchObject({ type: "bought", trader: ALICE });
  });

  it("keys per pool, so a deposit is not relabelled by a trade on the market's other pool", () => {
    const rows = classify(
      [transfer(YES, ALICE, POOL, "1000"), transfer(NO, OTHER_POOL, BOB, "40")],
      liquidityOn(POOL),
      [POOL, OTHER_POOL],
    );

    expect(rows).toEqual([
      expect.objectContaining({ type: "lp", trader: ALICE }),
      expect.objectContaining({ type: "bought", trader: BOB }),
    ]);
  });

  it("matches a checksummed pool against a lowercase liquidity key", () => {
    const keys = new Set([liquidityPoolTxKey(TX.toUpperCase(), POOL.toUpperCase())]);

    expect(classify([transfer(YES, ALICE, POOL, "1000")], keys)[0]).toMatchObject({ type: "lp" });
  });

  it("falls back to reading every pool leg as a trade when no liquidity data is available", () => {
    const rows = reconstructSplitMergeRedeemFromTransfers([transfer(YES, ALICE, POOL, "1000")], market(), sDai, {
      identifySwaps: true,
      poolAddresses: [POOL],
    });

    expect(rows[0]).toMatchObject({ type: "sold" });
  });

  it("drops a pool to pool hop, which names no trader", () => {
    expect(classify([transfer(YES, POOL, OTHER_POOL, "10")], new Set(), [POOL, OTHER_POOL])).toEqual([]);
  });

  it("drops a wallet to wallet transfer", () => {
    expect(classify([transfer(YES, ALICE, BOB, "100")])).toEqual([]);
  });

  it("drops a wrap leg against the zero address", () => {
    expect(classify([transfer(YES, zeroAddress, ALICE, "100")])).toEqual([]);
    expect(classify([transfer(YES, ALICE, zeroAddress, "100")])).toEqual([]);
  });

  it("still reconstructs a split from the router legs", () => {
    const rows = classify([
      transfer(SDAI, ALICE, GNOSIS_ROUTER, "100"),
      transfer(YES, GNOSIS_ROUTER, ALICE, "100"),
      transfer(NO, GNOSIS_ROUTER, ALICE, "100"),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ type: "split", trader: ALICE, amount: "100" });
  });
});
