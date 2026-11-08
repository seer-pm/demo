import { type Address, type Hex, concat, encodeAbiParameters, getAddress, keccak256, numberToHex, pad } from "viem";
import { describe, expect, it } from "vitest";
import { type Campaign, parseCampaigns } from "./campaigns.ts";
import { assertNoDecrease, buildDistributions } from "./distribution.ts";
import { Q128, accrueRewards } from "./engine.ts";
import type { ChainEvent } from "./events.ts";

const PM = "0x00000000000000000000000000000000000000aa" as Address;
const HOOK = "0x00000000000000000000000000000000000000bb" as Address;
const ALICE = getAddress("0x000000000000000000000000000000000000a11c");
const BOB = getAddress("0x0000000000000000000000000000000000000b0b");
const TOKEN = getAddress("0x00000000000000000000000000000000000000cc");
const POOL = `0x${"11".repeat(32)}` as Hex;
const T0 = Date.parse("2026-11-02T00:00:00Z") / 1000;

function campaign(overrides: Record<string, unknown> = {}): Campaign {
  return parseCampaigns({
    campaigns: [
      {
        id: "pool-a",
        chainId: 8453,
        poolId: POOL,
        payoutChainId: 8453,
        rewardToken: TOKEN,
        rates: [{ from: "2026-11-02T00:00:00Z", perSecond: "10" }],
        ...overrides,
      },
    ],
  })[0];
}

// Each event gets its own block unless `block` is given, so timestamps drive the intervals.
let log = 0;
const at = (t: number, block = BigInt(t)) => ({ blockNumber: block, logIndex: log++, timestamp: T0 + t });
const tick = (t: number, value: number, block?: bigint): ChainEvent => ({
  ...at(t, block),
  kind: "swap",
  poolId: POOL,
  tick: value,
});
const mint = (t: number, tokenId: bigint, owner: Address): ChainEvent => ({
  ...at(t),
  kind: "transfer",
  tokenId,
  to: owner,
});
const liquidity = (
  t: number,
  tokenId: bigint,
  delta: bigint,
  [tickLower, tickUpper] = [-60, 60],
  sender = PM,
  block?: bigint,
): ChainEvent => ({
  ...at(t, block),
  kind: "modifyLiquidity",
  poolId: POOL,
  sender,
  tickLower,
  tickUpper,
  liquidityDelta: delta,
  salt: pad(numberToHex(tokenId), { size: 32 }),
});

function earned(c: Campaign, events: ChainEvent[], cutoff: number) {
  const result: Record<string, bigint> = {};
  for (const a of accrueRewards({ positionManager: PM, campaigns: [c], events, cutoff: T0 + cutoff })) {
    const key = `${a.tokenId}:${a.owner}`;
    result[key] = (result[key] ?? 0n) + a.amountX128 / Q128;
  }
  return result;
}

describe("accrueRewards", () => {
  it("splits each second pro rata among in-range liquidity only, with tickUpper exclusive", () => {
    const events = [
      { ...at(0), kind: "initialize", poolId: POOL, tick: 0 } as ChainEvent,
      mint(0, 1n, ALICE),
      mint(0, 2n, BOB),
      liquidity(0, 1n, 300n, [-60, 60]),
      liquidity(0, 2n, 100n, [0, 120]),
      // At tick 60 Alice's [-60, 60) is out of range; Bob's [0, 120) still is.
      tick(100, 60),
    ];
    // 0..100: 1000 split 3:1; 100..200: all 1000 to Bob.
    expect(earned(campaign(), events, 200)).toEqual({ [`1:${ALICE}`]: 750n, [`2:${BOB}`]: 1250n });
  });

  it("keeps the budget while nothing is in range and stops at the cap", () => {
    const c = campaign({ budget: "1500" });
    const events = [
      tick(0, 500), // out of range of [-60, 60)
      mint(0, 1n, ALICE),
      liquidity(0, 1n, 1n),
      tick(100, 0),
    ];
    // 0..100 emits nothing; from 100 on 10/s until the 1500 budget runs out at 250.
    expect(earned(c, events, 1000)).toEqual({ [`1:${ALICE}`]: 1500n });
  });

  it("credits each interval to the owner at that time", () => {
    const events = [tick(0, 0), mint(0, 1n, ALICE), liquidity(0, 1n, 5n), mint(40, 1n, BOB)];
    expect(earned(campaign(), events, 100)).toEqual({ [`1:${ALICE}`]: 400n, [`1:${BOB}`]: 600n });
  });

  it("gives nothing to liquidity added and removed within one block, nor to hook or excluded liquidity", () => {
    const c = campaign({ excludeTokenIds: ["3"] });
    const events = [
      tick(0, 0),
      mint(0, 1n, ALICE),
      mint(0, 2n, BOB),
      mint(0, 3n, BOB),
      liquidity(0, 1n, 100n),
      liquidity(0, 9n, 10_000n, [-60, 60], HOOK),
      liquidity(0, 3n, 10_000n),
      // Bob joins and leaves inside block 50 with 100x Alice's liquidity.
      liquidity(50, 2n, 10_000n, [-60, 60], PM, 50n),
      liquidity(50, 2n, -10_000n, [-60, 60], PM, 50n),
    ];
    expect(earned(c, events, 100)).toEqual({ [`1:${ALICE}`]: 1000n });
  });

  it("applies rate tiers and ignores events at or after the cutoff", () => {
    const c = campaign({
      rates: [
        { from: "2026-11-02T00:00:00Z", perSecond: "10" },
        { from: "2026-11-02T00:01:40Z", perSecond: "0" }, // T0 + 100
        { from: "2026-11-02T00:03:20Z", perSecond: "3" }, // T0 + 200
      ],
    });
    const events = [tick(0, 0), mint(0, 1n, ALICE), liquidity(0, 1n, 1n), liquidity(300, 1n, -1n)];
    expect(earned(c, events, 300)).toEqual({ [`1:${ALICE}`]: 1000n + 300n });
  });
});

describe("buildDistributions", () => {
  it("sums an account across positions before flooring and emits URD-compatible proofs", () => {
    const c = campaign();
    const events = [
      tick(0, 0),
      mint(0, 1n, ALICE),
      mint(0, 2n, ALICE),
      mint(0, 3n, ALICE),
      mint(0, 4n, BOB),
      liquidity(0, 1n, 1n),
      liquidity(0, 2n, 1n),
      liquidity(0, 3n, 1n),
      liquidity(0, 4n, 1n),
    ];
    // 10 units split four ways: 2.5 each. Flooring per position would give Alice 6; summing first gives 7.
    const accruals = accrueRewards({ positionManager: PM, campaigns: [c], events, cutoff: T0 + 1 });
    const [d] = buildDistributions({ campaigns: [c], accruals, cutoff: T0 + 1, sourceBlocks: { 8453: 1n } });

    expect(d.claims[ALICE][TOKEN].claimable).toBe("7");
    expect(d.claims[BOB][TOKEN].claimable).toBe("2");
    expect(d.totals[TOKEN]).toBe("9");

    // Same check as UniversalRewardsDistributor.claim: double-hashed abi.encode leaf, sorted pairs.
    for (const [account, claimable] of [
      [ALICE, 7n],
      [BOB, 2n],
    ] as const) {
      let node = keccak256(
        keccak256(
          encodeAbiParameters(
            [{ type: "address" }, { type: "address" }, { type: "uint256" }],
            [account, TOKEN, claimable],
          ),
        ),
      );
      for (const sibling of d.claims[account][TOKEN].proof) {
        node = keccak256(node < sibling ? concat([node, sibling]) : concat([sibling, node]));
      }
      expect(node).toBe(d.root);
    }
  });

  it("rejects a distribution that lowers a published cumulative amount", () => {
    const c = campaign();
    const events = [tick(0, 0), mint(0, 1n, ALICE), liquidity(0, 1n, 1n)];
    const build = (cutoff: number) =>
      buildDistributions({
        campaigns: [c],
        accruals: accrueRewards({ positionManager: PM, campaigns: [c], events, cutoff: T0 + cutoff }),
        cutoff: T0 + cutoff,
        sourceBlocks: { 8453: 1n },
      })[0];
    expect(() => assertNoDecrease(build(10), build(20))).not.toThrow();
    expect(() => assertNoDecrease(build(20), build(10))).toThrow(/dropped from 200 to 100/);
  });
});
