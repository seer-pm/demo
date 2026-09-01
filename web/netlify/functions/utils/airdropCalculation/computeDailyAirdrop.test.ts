import type { Address } from "viem";
import { describe, expect, it, vi } from "vitest";

// The module builds a Supabase client at import time. These tests only exercise its pure half, so
// give the client something well-formed to construct from rather than a real project.
vi.hoisted(() => {
  process.env.SUPABASE_PROJECT_URL ||= "http://localhost:54321";
  process.env.SUPABASE_API_KEY ||= "test-key";
});

import { buildChainUsers, collectExcludedHolders } from "./computeDailyAirdrop";
import type { LiquidityEvent, LiquidityPosition } from "./getLiquidityBalances";
import type { PoolHourData } from "./getPoolHourDatas";
import type { PoolStateMap } from "./getPrices";

const CHAIN = 100;
const OUTCOME = "0x0000000000000000000000000000000000000001" as Address;
const COLLATERAL = "0x0000000000000000000000000000000000000002" as Address;
const POOL = "0x00000000000000000000000000000000000000aa";
const USER = "0x00000000000000000000000000000000000000bb";
const LP = "0x00000000000000000000000000000000000000cc";

/** One outcome token trading at 0.5 collateral, held in a single pool. */
const TOKEN1_PRICE = "0.5";

function poolHourData(over: Partial<PoolHourData> = {}): PoolHourData {
  return {
    id: `${POOL}-0`,
    token0Price: "2",
    token1Price: TOKEN1_PRICE,
    periodStartUnix: 0,
    sqrtPrice: null,
    liquidity: null,
    pool: {
      id: POOL,
      liquidity: null,
      token0: { id: OUTCOME, name: null },
      token1: { id: COLLATERAL, name: null },
    },
    ...over,
  };
}

function scenario(over: Partial<Parameters<typeof buildChainUsers>[0]> = {}) {
  const poolState: PoolStateMap = new Map([[OUTCOME + COLLATERAL, poolHourData()]]);
  return {
    chainId: CHAIN as Parameters<typeof buildChainUsers>[0]["chainId"],
    tokensByTimestamp: { [OUTCOME]: true } as { [key: Address]: boolean },
    poolState,
    processedPrices: { [OUTCOME]: 0.5 },
    directHoldings: [],
    positions: [],
    excludedHolders: new Set([POOL]),
    ...over,
  };
}

/** A wide in-range position: token1Price 0.5 sits near tick -6932. */
function position(over: Partial<LiquidityPosition> = {}): LiquidityPosition {
  return {
    origin: LP,
    token0: OUTCOME,
    token1: COLLATERAL,
    tickLower: -20000,
    tickUpper: 20000,
    liquidity: 10n ** 20n,
    ...over,
  };
}

describe("buildChainUsers", () => {
  it("credits a direct holder at the snapshot price", () => {
    const users = buildChainUsers(scenario({ directHoldings: [{ owner: USER, token: OUTCOME, balance: 2e18 }] }));
    expect(users[USER].directHolding).toBeCloseTo(1, 12);
    expect(users[USER].chainId).toBe(CHAIN);
  });

  it("does not credit an AMM pool for the reserves backing its LPs", () => {
    // The pool's balance is the tokens behind every LP position in it. Crediting the pool as well
    // counts them twice and mints a share of the emission to a contract that cannot claim it.
    const users = buildChainUsers(
      scenario({
        directHoldings: [
          { owner: POOL, token: OUTCOME, balance: 100e18 },
          { owner: USER, token: OUTCOME, balance: 2e18 },
        ],
      }),
    );
    expect(users[POOL]).toBeUndefined();
    expect(Object.keys(users)).toEqual([USER]);
  });

  it("excludes a pool whose address arrives checksummed", () => {
    const users = buildChainUsers(
      scenario({ directHoldings: [{ owner: POOL.toUpperCase(), token: OUTCOME, balance: 100e18 }] }),
    );
    expect(users).toEqual({});
  });

  it("still credits the LPs of an excluded pool", () => {
    const users = buildChainUsers(
      scenario({
        directHoldings: [{ owner: POOL, token: OUTCOME, balance: 100e18 }],
        positions: [position()],
      }),
    );
    expect(users[POOL]).toBeUndefined();
    expect(users[LP].indirectHolding).toBeGreaterThan(0);
    expect(users[LP].directHolding).toBe(0);
  });

  it("skips tokens whose market has finalized", () => {
    const users = buildChainUsers(
      scenario({
        tokensByTimestamp: {} as { [key: Address]: boolean },
        directHoldings: [{ owner: USER, token: OUTCOME, balance: 2e18 }],
      }),
    );
    expect(users).toEqual({});
  });

  it("values a position at the snapshot price, not at deposit", () => {
    // Same liquidity, different price: the composition slides, so the collateral value must move.
    const atHalf = buildChainUsers(scenario({ positions: [position()] }));
    const cheapPool: PoolStateMap = new Map([
      [OUTCOME + COLLATERAL, poolHourData({ token1Price: "0.05", token0Price: "20" })],
    ]);
    const atFivePercent = buildChainUsers(
      scenario({ poolState: cheapPool, processedPrices: { [OUTCOME]: 0.05 }, positions: [position()] }),
    );
    expect(atFivePercent[LP].indirectHolding).not.toBeCloseTo(atHalf[LP].indirectHolding, 6);
  });

  it("ignores a position whose pool has no candle to price it", () => {
    const users = buildChainUsers(scenario({ poolState: new Map(), positions: [position()] }));
    expect(users).toEqual({});
  });
});

describe("collectExcludedHolders", () => {
  const event = (poolId: string): LiquidityEvent => ({
    id: poolId,
    pool: { id: poolId },
    token0: { id: OUTCOME, symbol: "T0" },
    token1: { id: COLLATERAL, symbol: "T1" },
    amount: "1",
    amount0: "0",
    amount1: "0",
    tickLower: "-60",
    tickUpper: "60",
    timestamp: "1",
    origin: LP,
    type: "mint",
  });

  it("unions pools from liquidity events and from price candles", () => {
    // Neither source is complete alone: a pool that never traded has no candle, and a pool whose
    // mint/burn history we did not fetch still appears in the price table.
    const excluded = collectExcludedHolders(
      [event("0xAAA")],
      [poolHourData({ pool: { ...poolHourData().pool, id: "0xBBB" } })],
    );
    expect(excluded).toEqual(new Set(["0xaaa", "0xbbb"]));
  });
});

describe("buildChainUsers executor roll-up", () => {
  const EXECUTOR = "0x00000000000000000000000000000000000000e1";
  const OWNER = "0x00000000000000000000000000000000000000e2";
  const owners = { [EXECUTOR]: OWNER };

  it("credits an executor's direct holdings to its owner", () => {
    const users = buildChainUsers(
      scenario({
        directHoldings: [{ owner: EXECUTOR, token: OUTCOME, balance: 2e18 }],
        executorOwners: owners,
      }),
    );
    expect(users[EXECUTOR]).toBeUndefined();
    expect(users[OWNER].directHolding).toBeCloseTo(1, 12);
  });

  it("merges a holder's own wallet with their executor into one participant", () => {
    const users = buildChainUsers(
      scenario({
        directHoldings: [
          { owner: OWNER, token: OUTCOME, balance: 2e18 },
          { owner: EXECUTOR, token: OUTCOME, balance: 2e18 },
        ],
        executorOwners: owners,
      }),
    );
    // One identity, not two. This is the point of the roll-up: the PoH pool weights by
    // sqrt(total), and sqrt(a) + sqrt(b) > sqrt(a + b), so leaving them split paid the same
    // person more than one wallet's worth.
    expect(Object.keys(users)).toEqual([OWNER]);
    expect(users[OWNER].directHolding).toBeCloseTo(2, 12);
  });

  it("credits an executor's LP positions to its owner", () => {
    const users = buildChainUsers(
      scenario({
        positions: [position({ origin: EXECUTOR })],
        executorOwners: owners,
      }),
    );
    expect(users[EXECUTOR]).toBeUndefined();
    expect(users[OWNER].indirectHolding).toBeGreaterThan(0);
  });

  it("leaves plain wallets alone, with or without a map", () => {
    const withMap = buildChainUsers(
      scenario({ directHoldings: [{ owner: USER, token: OUTCOME, balance: 2e18 }], executorOwners: owners }),
    );
    const withoutMap = buildChainUsers(scenario({ directHoldings: [{ owner: USER, token: OUTCOME, balance: 2e18 }] }));
    expect(withMap[USER].directHolding).toBeCloseTo(1, 12);
    expect(withoutMap[USER].directHolding).toBeCloseTo(1, 12);
  });

  it("still drops pool addresses, which are excluded before any roll-up", () => {
    const users = buildChainUsers(
      scenario({
        directHoldings: [{ owner: POOL, token: OUTCOME, balance: 2e18 }],
        executorOwners: owners,
      }),
    );
    expect(users[POOL]).toBeUndefined();
    expect(Object.keys(users)).toHaveLength(0);
  });
});
