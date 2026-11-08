import { type Address, type Hex, hexToBigInt } from "viem";
import { type Campaign, emittedBetween } from "./campaigns.ts";
import { type ChainEvent, sortEvents } from "./events.ts";

/** Accruals keep 128 fractional bits so per-interval rounding never adds up; only claims are floored. */
export const Q128 = 1n << 128n;

/** Reward weeks start on Monday 00:00 UTC. The first Monday after the Unix epoch is 1970-01-05. */
export const WEEK = 7 * 86_400;
const FIRST_MONDAY = 4 * 86_400;

/** Start of the reward week that contains `t` (unix seconds). */
export function weekStart(t: number): number {
  return t - ((((t - FIRST_MONDAY) % WEEK) + WEEK) % WEEK);
}

/** What one owner earned from one position in one campaign, scaled by `Q128`. */
export type PositionAccrual = { campaignId: string; tokenId: bigint; owner: Address; amountX128: bigint };

type Position = { tickLower: number; tickUpper: number; liquidity: bigint };
/** `clock` is the instant up to which the pool's campaigns have been accrued. */
type Pool = { clock?: number; tick?: number; positions: Map<bigint, Position> };

/** Everything needed to continue the replay after `cutoff` without reading earlier events again. */
export type EngineState = {
  cutoff: number;
  pools: Map<Hex, Pool>;
  owners: Map<bigint, Address>;
  budgetUsed: Map<string, bigint>;
  accrued: Map<string, PositionAccrual>;
};

const accrualKey = (campaignId: string, tokenId: bigint, owner: Address) => `${campaignId}:${tokenId}:${owner}`;

/**
 * Replays one chain's events and splits each campaign's emission the way Algebra eternal farming
 * does: over every interval in which the pool state is constant, the interval's emission goes
 * pro rata by liquidity to the eligible positions with `tickLower <= tick < tickUpper`.
 *
 * - Only PositionManager positions earn (`sender` = PositionManager, `salt` = token id); hook-owned
 *   limit-order liquidity and positions of other routers neither earn nor dilute.
 * - Intervals with no eligible liquidity in range emit nothing and consume no budget.
 * - State changes take effect at their block's timestamp, so only the state at the end of a block
 *   earns: liquidity added and removed within one block earns nothing.
 * - Each interval is credited to the NFT's owner during that interval.
 * - A pool's intervals end only at that pool's events, at transfers of its positions and at every
 *   Monday 00:00 UTC. Rounding then never depends on other pools' campaigns, and resuming from
 *   the state of a weekly run gives exactly the result of one replay from the start.
 *
 * `campaigns` must all be on the chain of `events`; events at or after `cutoff` are ignored. With
 * `state`, `events` must hold only what that state has not applied: the events after its cutoff,
 * plus the full history of pools and token ids it does not track yet.
 */
export function accrueRewards({
  positionManager,
  campaigns,
  events,
  cutoff,
  state,
}: {
  positionManager: Address;
  campaigns: Campaign[];
  events: ChainEvent[];
  cutoff: number;
  state?: EngineState;
}): EngineState {
  if (state && cutoff < state.cutoff) throw new Error(`cutoff ${cutoff} is before the state's cutoff ${state.cutoff}`);
  const { pools, owners, budgetUsed, accrued }: EngineState = state
    ? structuredClone(state)
    : { cutoff, pools: new Map(), owners: new Map(), budgetUsed: new Map(), accrued: new Map() };
  const resumedPools = new Set(pools.keys());
  const resumedTokens = new Set(owners.keys());

  const campaignsByPool = new Map<Hex, Campaign[]>();
  for (const campaign of campaigns) {
    if (!pools.has(campaign.poolId)) pools.set(campaign.poolId, { positions: new Map() });
    if (!budgetUsed.has(campaign.id)) budgetUsed.set(campaign.id, 0n);
    campaignsByPool.set(campaign.poolId, [...(campaignsByPool.get(campaign.poolId) ?? []), campaign]);
  }

  const accrue = (poolId: Hex, { tick, positions }: Pool, start: number, end: number) => {
    if (tick === undefined) return;
    for (const campaign of campaignsByPool.get(poolId) ?? []) {
      const eligible = [...positions].filter(
        ([tokenId, p]) =>
          p.tickLower <= tick &&
          tick < p.tickUpper &&
          p.tickUpper - p.tickLower >= campaign.minWidthTicks &&
          !campaign.excludeTokenIds.has(tokenId),
      );
      if (eligible.length === 0) continue;

      let amount = emittedBetween(campaign.rates, start, end);
      const used = budgetUsed.get(campaign.id)!;
      if (campaign.budget !== undefined && amount > campaign.budget - used) amount = campaign.budget - used;
      if (amount <= 0n) continue;
      budgetUsed.set(campaign.id, used + amount);

      const totalLiquidity = eligible.reduce((sum, [, p]) => sum + p.liquidity, 0n);
      for (const [tokenId, p] of eligible) {
        const owner = owners.get(tokenId);
        if (!owner) throw new Error(`campaign ${campaign.id}: no Transfer event seen for token id ${tokenId}`);
        const key = accrualKey(campaign.id, tokenId, owner);
        const entry = accrued.get(key) ?? { campaignId: campaign.id, tokenId, owner, amountX128: 0n };
        entry.amountX128 += (amount * Q128 * p.liquidity) / totalLiquidity;
        accrued.set(key, entry);
      }
    }
  };

  const advance = (poolId: Hex, to: number) => {
    const pool = pools.get(poolId)!;
    if (pool.clock === undefined) {
      pool.clock = to;
      return;
    }
    while (pool.clock < to) {
      const end = Math.min(to, weekStart(pool.clock) + WEEK);
      accrue(poolId, pool, pool.clock, end);
      pool.clock = end;
    }
  };

  for (const event of sortEvents(events)) {
    if (event.timestamp >= cutoff) break;
    if (
      state &&
      event.timestamp < state.cutoff &&
      (event.kind === "transfer" ? resumedTokens.has(event.tokenId) : resumedPools.has(event.poolId))
    ) {
      throw new Error(`event in block ${event.blockNumber} is before the state's cutoff and was already applied`);
    }

    if (event.kind === "transfer") {
      for (const [poolId, pool] of pools) if (pool.positions.has(event.tokenId)) advance(poolId, event.timestamp);
      owners.set(event.tokenId, event.to);
      continue;
    }
    const pool = pools.get(event.poolId);
    if (!pool) continue;
    advance(event.poolId, event.timestamp);
    if (event.kind !== "modifyLiquidity") {
      pool.tick = event.tick;
      continue;
    }
    if (event.sender.toLowerCase() !== positionManager.toLowerCase()) continue;

    const tokenId = hexToBigInt(event.salt);
    const position = pool.positions.get(tokenId) ?? {
      tickLower: event.tickLower,
      tickUpper: event.tickUpper,
      liquidity: 0n,
    };
    position.liquidity += event.liquidityDelta;
    if (position.liquidity < 0n) throw new Error(`token id ${tokenId}: liquidity below zero`);
    if (position.liquidity === 0n) pool.positions.delete(tokenId);
    else pool.positions.set(tokenId, position);
  }
  for (const [poolId, pool] of pools) if (pool.clock !== undefined) advance(poolId, cutoff);

  return { cutoff, pools, owners, budgetUsed, accrued };
}

/** JSON form of `EngineState`, written next to each published distribution. */
export type EngineStateJson = {
  cutoff: number;
  pools: Record<
    string,
    {
      clock: number | null;
      tick: number | null;
      positions: Record<string, { tickLower: number; tickUpper: number; liquidity: string }>;
    }
  >;
  owners: Record<string, Address>;
  budgetUsed: Record<string, string>;
  accrued: { campaignId: string; tokenId: string; owner: Address; amountX128: string }[];
};

export function serializeState(state: EngineState): EngineStateJson {
  return {
    cutoff: state.cutoff,
    pools: Object.fromEntries(
      [...state.pools].map(([poolId, pool]) => [
        poolId,
        {
          clock: pool.clock ?? null,
          tick: pool.tick ?? null,
          positions: Object.fromEntries(
            [...pool.positions].map(([tokenId, p]) => [
              tokenId.toString(),
              { ...p, liquidity: p.liquidity.toString() },
            ]),
          ),
        },
      ]),
    ),
    owners: Object.fromEntries([...state.owners].map(([tokenId, owner]) => [tokenId.toString(), owner])),
    budgetUsed: Object.fromEntries([...state.budgetUsed].map(([id, used]) => [id, used.toString()])),
    accrued: [...state.accrued.values()].map((a) => ({
      ...a,
      tokenId: a.tokenId.toString(),
      amountX128: a.amountX128.toString(),
    })),
  };
}

export function parseState(json: EngineStateJson): EngineState {
  return {
    cutoff: json.cutoff,
    pools: new Map(
      Object.entries(json.pools).map(([poolId, pool]) => [
        poolId as Hex,
        {
          clock: pool.clock ?? undefined,
          tick: pool.tick ?? undefined,
          positions: new Map(
            Object.entries(pool.positions).map(([tokenId, p]) => [
              BigInt(tokenId),
              { ...p, liquidity: BigInt(p.liquidity) },
            ]),
          ),
        },
      ]),
    ),
    owners: new Map(Object.entries(json.owners).map(([tokenId, owner]) => [BigInt(tokenId), owner])),
    budgetUsed: new Map(Object.entries(json.budgetUsed).map(([id, used]) => [id, BigInt(used)])),
    accrued: new Map(
      json.accrued.map((a) => {
        const entry = { ...a, tokenId: BigInt(a.tokenId), amountX128: BigInt(a.amountX128) };
        return [accrualKey(entry.campaignId, entry.tokenId, entry.owner), entry];
      }),
    ),
  };
}
