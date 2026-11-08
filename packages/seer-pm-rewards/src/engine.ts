import { type Address, type Hex, hexToBigInt } from "viem";
import { type Campaign, emittedBetween } from "./campaigns.ts";
import { type ChainEvent, sortEvents } from "./events.ts";

/** Accruals keep 128 fractional bits so per-interval rounding never adds up; only claims are floored. */
export const Q128 = 1n << 128n;

/** What one owner earned from one position in one campaign, scaled by `Q128`. */
export type PositionAccrual = { campaignId: string; tokenId: bigint; owner: Address; amountX128: bigint };

type Position = { tickLower: number; tickUpper: number; liquidity: bigint };
type Pool = { tick?: number; positions: Map<bigint, Position> };

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
 *
 * `campaigns` must all be on the chain of `events`; events at or after `cutoff` are ignored.
 */
export function accrueRewards({
  positionManager,
  campaigns,
  events,
  cutoff,
}: {
  positionManager: Address;
  campaigns: Campaign[];
  events: ChainEvent[];
  cutoff: number;
}): PositionAccrual[] {
  const pools = new Map<Hex, Pool>(campaigns.map((c) => [c.poolId, { positions: new Map() }]));
  const owners = new Map<bigint, Address>();
  const budgetUsed = new Map<string, bigint>(campaigns.map((c) => [c.id, 0n]));
  const accrued = new Map<string, PositionAccrual>();
  let clock: number | undefined;

  const advance = (to: number) => {
    if (clock === undefined || to <= clock) return;
    for (const campaign of campaigns) {
      const { tick, positions } = pools.get(campaign.poolId)!;
      if (tick === undefined) continue;
      const eligible = [...positions].filter(
        ([tokenId, p]) =>
          p.tickLower <= tick &&
          tick < p.tickUpper &&
          p.tickUpper - p.tickLower >= campaign.minWidthTicks &&
          !campaign.excludeTokenIds.has(tokenId),
      );
      if (eligible.length === 0) continue;

      let amount = emittedBetween(campaign.rates, clock, to);
      const used = budgetUsed.get(campaign.id)!;
      if (campaign.budget !== undefined && amount > campaign.budget - used) amount = campaign.budget - used;
      if (amount === 0n) continue;
      budgetUsed.set(campaign.id, used + amount);

      const totalLiquidity = eligible.reduce((sum, [, p]) => sum + p.liquidity, 0n);
      for (const [tokenId, p] of eligible) {
        const owner = owners.get(tokenId);
        if (!owner) throw new Error(`campaign ${campaign.id}: no Transfer event seen for token id ${tokenId}`);
        const key = `${campaign.id}:${tokenId}:${owner}`;
        const entry = accrued.get(key) ?? { campaignId: campaign.id, tokenId, owner, amountX128: 0n };
        entry.amountX128 += (amount * Q128 * p.liquidity) / totalLiquidity;
        accrued.set(key, entry);
      }
    }
    clock = to;
  };

  for (const event of sortEvents(events)) {
    if (event.timestamp >= cutoff) break;
    if (clock === undefined) clock = event.timestamp;
    advance(event.timestamp);

    if (event.kind === "transfer") {
      owners.set(event.tokenId, event.to);
      continue;
    }
    const pool = pools.get(event.poolId);
    if (!pool) continue;
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
  advance(cutoff);

  return [...accrued.values()];
}
