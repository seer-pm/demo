import { PAYOUT_CHAINS } from "@seer-pm/rewards/claims";
import { formatUnits } from "viem";

/** Rate of a `RewardCampaigns` campaign: `perSecond` base units from `from` (unix seconds) on. */
export type RewardRate = { from: bigint; perSecond: bigint };

export const WEEK_SECONDS = 604_800;

/** Per-second rate for `weekly` base units a week, rounded down so a week never emits more than entered. */
export function perSecondFromWeekly(weekly: bigint): bigint {
  return weekly / BigInt(WEEK_SECONDS);
}

export type CampaignStatus = {
  ended: boolean;
  /** The rate in effect now; every rate starts in the block that set it, so it is the last one. */
  current: RewardRate;
  /** The last non-zero rate, which an ended campaign paid before it stopped. */
  lastPaid: RewardRate;
  start: number;
  /** When the zero rate that ended the campaign took effect. */
  end?: number;
};

export function campaignStatus(rates: readonly RewardRate[]): CampaignStatus {
  const current = rates[rates.length - 1];
  const ended = current.perSecond === 0n;
  return {
    ended,
    current,
    lastPaid: rates.filter((rate) => rate.perSecond > 0n).pop() ?? current,
    start: Number(rates[0].from),
    end: ended ? Number(current.from) : undefined,
  };
}

/** What the rates of an ended campaign emit from `from` to its end, as the registry's `_maxEmittedSince` does. */
function maxEmittedSince(rates: readonly RewardRate[], from: bigint): bigint {
  let total = 0n;
  for (let i = rates.length - 1; i > 0 && rates[i].from > from; i--) {
    const start = rates[i - 1].from > from ? rates[i - 1].from : from;
    total += rates[i - 1].perSecond * (rates[i].from - start);
  }
  return total;
}

/**
 * What a refund of an ended campaign sends now (`amount`), and what the registry holds back (`held`) because the
 * campaign may have emitted it since the bot's last release. `held` comes back after the release of the week the
 * campaign ended in, minus what it did emit.
 */
export function refundState(campaign: {
  rates: readonly RewardRate[];
  budget: bigint;
  released: bigint;
  releasedUpTo: number;
}): { kind: "none" } | { kind: "held"; held: bigint } | { kind: "ready"; amount: bigint; held: bigint } {
  if (!campaignStatus(campaign.rates).ended) return { kind: "none" };
  const max = maxEmittedSince(campaign.rates, BigInt(campaign.releasedUpTo));
  const remaining = campaign.budget - campaign.released;
  const held = max < remaining ? max : remaining;
  if (remaining > held) return { kind: "ready", amount: remaining - held, held };
  return held > 0n ? { kind: "held", held } : { kind: "none" };
}

export const chainName = (chainId: number) => PAYOUT_CHAINS[chainId]?.chain.name ?? `Chain ${chainId}`;

/** `yyyy-mm-dd` of a unix time, in UTC. */
export const toDate = (t: number) => new Date(t * 1000).toISOString().slice(0, 10);

/** A rate per week in token units, or per second in base units when the token is unknown. */
export function formatWeekly(rate: RewardRate, token: { symbol: string; decimals: number } | undefined) {
  if (!token) return `${rate.perSecond}/s`;
  const weekly = Number(formatUnits(rate.perSecond * BigInt(WEEK_SECONDS), token.decimals));
  return `${weekly.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${token.symbol}/week`;
}
