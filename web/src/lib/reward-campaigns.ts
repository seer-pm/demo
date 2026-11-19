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

export const chainName = (chainId: number) => PAYOUT_CHAINS[chainId]?.chain.name ?? `Chain ${chainId}`;

/** `yyyy-mm-dd` of a unix time, in UTC. */
export const toDate = (t: number) => new Date(t * 1000).toISOString().slice(0, 10);

/** A rate per week in token units, or per second in base units when the token is unknown. */
export function formatWeekly(rate: RewardRate, token: { symbol: string; decimals: number } | undefined) {
  if (!token) return `${rate.perSecond}/s`;
  const weekly = Number(formatUnits(rate.perSecond * BigInt(WEEK_SECONDS), token.decimals));
  return `${weekly.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${token.symbol}/week`;
}
