import { type Address, type Hex, getAddress, isAddress } from "viem";
import { PAYOUT_CHAIN_IDS, SOURCE_CHAINS } from "./chains.ts";

/** `perSecond` (reward token base units) applies from `from` (unix seconds) until the next tier. */
export type RateTier = { from: number; perSecond: bigint };

export type Campaign = {
  id: string;
  /** Chain of the V4 pool. */
  chainId: number;
  /** Lowercase V4 pool id. */
  poolId: Hex;
  /** Chain whose distributor pays the rewards; `rewardToken` is the token on that chain. */
  payoutChainId: number;
  rewardToken: Address;
  /** Sorted by `from`; the first tier's `from` is the start of the campaign. */
  rates: RateTier[];
  /** Total the campaign may ever emit; unlimited when absent. */
  budget?: bigint;
  /** Positions narrower than this (`tickUpper - tickLower`) neither earn nor dilute. */
  minWidthTicks: number;
  excludeTokenIds: Set<bigint>;
};

const UINT = /^\d+$/;

function fail(id: string, message: string): never {
  throw new Error(`campaign ${id}: ${message}`);
}

function parseUint(id: string, field: string, value: unknown): bigint {
  if (typeof value !== "string" || !UINT.test(value)) fail(id, `${field} must be an integer string`);
  return BigInt(value);
}

/** Only `YYYY-MM-DDTHH:MM:SSZ`: an explicit UTC instant with whole seconds. */
function parseInstant(id: string, value: unknown): number {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)) {
    fail(id, `rate "from" must look like 2026-11-09T00:00:00Z, got ${JSON.stringify(value)}`);
  }
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) fail(id, `invalid date ${value}`);
  return ms / 1000;
}

/** Parses and validates the contents of `campaigns.json`. */
export function parseCampaigns(json: unknown): Campaign[] {
  const list = (json as { campaigns?: unknown })?.campaigns;
  if (!Array.isArray(list)) throw new Error('campaigns file must be { "campaigns": [...] }');

  const ids = new Set<string>();
  return list.map((raw: Record<string, unknown>) => {
    const id = raw.id;
    if (typeof id !== "string" || id === "") throw new Error("every campaign needs a non-empty id");
    if (ids.has(id)) fail(id, "duplicate id");
    ids.add(id);

    const chainId = raw.chainId;
    if (typeof chainId !== "number" || !SOURCE_CHAINS[chainId]) fail(id, `unsupported chainId ${chainId}`);
    const payoutChainId = raw.payoutChainId;
    if (typeof payoutChainId !== "number" || !PAYOUT_CHAIN_IDS.includes(payoutChainId)) {
      fail(id, `unsupported payoutChainId ${payoutChainId}`);
    }
    if (typeof raw.poolId !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(raw.poolId)) fail(id, "poolId must be 32 bytes");
    if (typeof raw.rewardToken !== "string" || !isAddress(raw.rewardToken)) fail(id, "invalid rewardToken");

    if (!Array.isArray(raw.rates) || raw.rates.length === 0) fail(id, "rates must be a non-empty list");
    const rates = raw.rates.map((tier: Record<string, unknown>) => ({
      from: parseInstant(id, tier.from),
      perSecond: parseUint(id, "perSecond", tier.perSecond),
    }));
    rates.forEach((tier, i) => {
      if (i > 0 && tier.from <= rates[i - 1].from) fail(id, "rate tiers must be in strictly increasing order");
    });

    const minWidthTicks = raw.minWidthTicks ?? 0;
    if (typeof minWidthTicks !== "number" || !Number.isInteger(minWidthTicks) || minWidthTicks < 0) {
      fail(id, "minWidthTicks must be a non-negative integer");
    }
    const excluded = raw.excludeTokenIds ?? [];
    if (!Array.isArray(excluded)) fail(id, "excludeTokenIds must be a list");

    return {
      id,
      chainId,
      poolId: raw.poolId.toLowerCase() as Hex,
      payoutChainId,
      rewardToken: getAddress(raw.rewardToken),
      rates,
      budget: raw.budget === undefined ? undefined : parseUint(id, "budget", raw.budget),
      minWidthTicks,
      excludeTokenIds: new Set(excluded.map((tokenId) => parseUint(id, "excludeTokenIds", String(tokenId)))),
    };
  });
}

/** Amount the rate tiers emit over `[start, end)`, before any budget cap. */
export function emittedBetween(rates: RateTier[], start: number, end: number): bigint {
  let total = 0n;
  rates.forEach((tier, i) => {
    const lo = Math.max(start, tier.from);
    const hi = Math.min(end, rates[i + 1]?.from ?? Number.POSITIVE_INFINITY);
    if (hi > lo) total += tier.perSecond * BigInt(hi - lo);
  });
  return total;
}
