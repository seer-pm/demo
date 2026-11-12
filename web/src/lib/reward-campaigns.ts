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

/**
 * Whether an ended campaign has budget to refund. The registry settles a refund only once the bot released a week whose
 * cutoff is at or after the end ("waiting" until then), because emission up to the end is final only then.
 */
export function refundState(campaign: {
  rates: readonly RewardRate[];
  budget: bigint;
  released: bigint;
  releasedUpTo: number;
}): { kind: "none" } | { kind: "waiting" } | { kind: "ready"; amount: bigint } {
  const { ended, end } = campaignStatus(campaign.rates);
  if (!ended || campaign.budget <= campaign.released) return { kind: "none" };
  if (campaign.releasedUpTo < end!) return { kind: "waiting" };
  return { kind: "ready", amount: campaign.budget - campaign.released };
}

/**
 * How the registry splits `unspent` among `deposits` on refund: each share is the step between floored cumulative
 * proportional shares, so they add up to `unspent` and none exceeds its deposit.
 */
export function refundShares<T extends { amount: bigint }>(unspent: bigint, deposits: readonly T[]) {
  const total = deposits.reduce((sum, d) => sum + d.amount, 0n);
  let cumulative = 0n;
  let credited = 0n;
  return deposits.map((d) => {
    cumulative += d.amount;
    const share = (unspent * cumulative) / total - credited;
    credited += share;
    return { ...d, share };
  });
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
