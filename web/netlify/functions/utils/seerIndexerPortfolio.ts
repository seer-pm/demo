import { DEFAULT_CHAIN } from "@/lib/chains";
import type { PortfolioPosition, SupportedChain, Token, TransactionData } from "@seer-pm/sdk";
import { unescapeJson } from "@seer-pm/sdk/market";
import { Order_By } from "@seer-pm/sdk/subgraph/seer";
import { type Address, formatUnits } from "viem";
import { seerEnvioSdk } from "./envioClient";
import { getTokenDecimals } from "./tokenDecimals";

const PAGE = 1000;
const MAX_TRANSFER_MARKET_PAGES = 50;
const SECONDS_PER_DAY = 86_400;
const FALLBACK_EARLIEST = Math.floor(new Date("2024-01-01").getTime() / 1000);

export type PortfolioPlPeriod = "1d" | "1w" | "1m" | "all";
export const PORTFOLIO_PL_PERIODS: PortfolioPlPeriod[] = ["1d", "1w", "1m", "all"];

export function floorUtcDay(ts: number): number {
  return Math.floor(ts / SECONDS_PER_DAY) * SECONDS_PER_DAY;
}

/** Last unix second of the UTC day containing `ts`. */
export function endOfUtcDay(ts: number): number {
  return floorUtcDay(ts) + SECONDS_PER_DAY - 1;
}

function accountActivityEntityId(chainId: number, account: Address): string {
  return `${chainId}:${account.toLowerCase()}`;
}

export type AccountActivityRow = {
  earliestTransferTimestamp: number;
  lastTransferTimestamp: number;
  transferCount: number;
};

function mapAccountActivityRow(row: {
  earliestTransferTimestamp: string;
  lastTransferTimestamp: string;
  transferCount: string;
}): AccountActivityRow {
  return {
    earliestTransferTimestamp: Number(row.earliestTransferTimestamp),
    lastTransferTimestamp: Number(row.lastTransferTimestamp),
    transferCount: Number(row.transferCount),
  };
}

export async function fetchAccountActivity(
  account: Address,
  chainId: SupportedChain,
): Promise<AccountActivityRow | null> {
  const { accountActivity } = await seerEnvioSdk(chainId).GetAccountActivity({
    id: accountActivityEntityId(chainId, account),
  });
  if (!accountActivity) return null;
  return mapAccountActivityRow(accountActivity);
}

/** All chain rows for an account from the shared HyperIndex (one HTTP call). */
export async function fetchAccountActivities(account: Address): Promise<AccountActivityRow[]> {
  const { AccountActivity: rows } = await seerEnvioSdk(DEFAULT_CHAIN).GetAccountActivities({
    account: account.toLowerCase(),
  });
  return rows.map(mapAccountActivityRow);
}

/**
 * Distinct market addresses from this account's indexed transfers (outcome / router legs).
 * Used when head holdings are empty so swap/LP cashflow can still load historical markets.
 */
export async function fetchMarketIdsFromAccountTransfers(
  account: Address,
  chainId: SupportedChain,
  endTime: number,
): Promise<Address[]> {
  const sdk = seerEnvioSdk(chainId);
  const accountLc = account.toLowerCase();
  const markets = new Set<string>();
  let offset = 0;
  let pages = 0;
  for (;;) {
    const { Transfer: rows } = await sdk.GetTransfers({
      limit: PAGE,
      offset,
      orderBy: [{ timestamp: Order_By.Asc }, { id: Order_By.Asc }],
      where: {
        chainId: { _eq: String(chainId) },
        timestamp: { _lte: String(endTime) },
        kind: { _in: ["outcome", "router_collateral"] },
        _or: [{ from: { _eq: accountLc } }, { to: { _eq: accountLc } }],
      },
    });
    for (const row of rows) {
      const addr = row.market?.address?.toLowerCase();
      if (addr) markets.add(addr);
    }
    pages += 1;
    if (rows.length < PAGE) break;
    if (pages >= MAX_TRANSFER_MARKET_PAGES) {
      console.warn("seerIndexerPortfolio: transfer market scan hit page cap", {
        account: accountLc,
        chainId,
        pages,
        markets: markets.size,
      });
      break;
    }
    offset += PAGE;
  }
  return [...markets] as Address[];
}

/** Head balances for all TokenBalance rows of the account (includes zeros). */
export async function fetchTokenBalances(account: Address, chainId: SupportedChain): Promise<Map<string, bigint>> {
  const sdk = seerEnvioSdk(chainId);
  const accountLc = account.toLowerCase();
  const out = new Map<string, bigint>();
  let offset = 0;
  for (;;) {
    const { TokenBalance: rows } = await sdk.GetTokenBalances({
      limit: PAGE,
      offset,
      orderBy: [{ token: Order_By.Asc }],
      where: {
        chainId: { _eq: String(chainId) },
        account: { _eq: accountLc },
      },
    });
    for (const row of rows) {
      out.set(row.token.toLowerCase(), BigInt(row.balance));
    }
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  return out;
}

/**
 * EOD balances for several timestamps in one TokenBalanceDaily pagination.
 * For each `eodTs`, returns latest daily per token with dayStart <= floorUtcDay(eodTs).
 * Queries by account + dayStart only; `tokens` is applied in memory to avoid oversized `_in` payloads.
 */
export async function fetchTokenBalancesAtEods(
  account: Address,
  chainId: SupportedChain,
  eodTimestamps: number[],
  tokens: Address[],
): Promise<Map<number, Map<string, bigint>>> {
  const uniqueEods = [...new Set(eodTimestamps)];
  const out = new Map<number, Map<string, bigint>>();
  for (const eod of uniqueEods) {
    out.set(eod, new Map());
  }
  if (uniqueEods.length === 0 || tokens.length === 0) return out;

  const floorByEod = new Map(uniqueEods.map((eod) => [eod, floorUtcDay(eod)]));
  const dayStartMax = Math.max(...floorByEod.values());
  const tokenSet = new Set(tokens.map((t) => t.toLowerCase()));

  type Best = { day: number; balance: bigint };
  const bestByEod = new Map<number, Map<string, Best>>();
  for (const eod of uniqueEods) {
    bestByEod.set(eod, new Map());
  }

  const sdk = seerEnvioSdk(chainId);
  const accountLc = account.toLowerCase();
  let offset = 0;
  for (;;) {
    const { TokenBalanceDaily: rows } = await sdk.GetTokenBalanceDailies({
      limit: PAGE,
      offset,
      orderBy: [{ dayStartTimestamp: Order_By.Desc }, { id: Order_By.Desc }],
      where: {
        chainId: { _eq: String(chainId) },
        account: { _eq: accountLc },
        dayStartTimestamp: { _lte: String(dayStartMax) },
      },
    });
    for (const row of rows) {
      const token = row.token.toLowerCase();
      if (!tokenSet.has(token)) continue;
      const day = Number(row.dayStartTimestamp);
      const balance = BigInt(row.balance);
      for (const eod of uniqueEods) {
        if (day > floorByEod.get(eod)!) continue;
        const best = bestByEod.get(eod)!;
        const prev = best.get(token);
        if (!prev || day > prev.day) {
          best.set(token, { day, balance });
        }
      }
    }
    if (rows.length < PAGE) break;
    offset += PAGE;
  }

  for (const eod of uniqueEods) {
    const bal = out.get(eod)!;
    for (const [token, v] of bestByEod.get(eod)!) {
      bal.set(token, v.balance);
    }
  }
  return out;
}

export function eodStartTimesForPeriods(
  endTime: number,
  earliestActivityTs: number | null,
): Record<PortfolioPlPeriod, number> {
  const todayStart = floorUtcDay(endTime);
  const allBase = earliestActivityTs && earliestActivityTs > 0 ? earliestActivityTs : FALLBACK_EARLIEST;
  // `all` starts at EOD of the UTC day *before* first activity so day-0 legs (e.g. wrap
  // splitFromDai) fall in (start, end] and affect deltaV — not only the valueStart baseline.
  return {
    "1d": endOfUtcDay(todayStart - SECONDS_PER_DAY),
    "1w": endOfUtcDay(todayStart - 7 * SECONDS_PER_DAY),
    "1m": endOfUtcDay(todayStart - 30 * SECONDS_PER_DAY),
    all: endOfUtcDay(allBase - SECONDS_PER_DAY),
  };
}

type RouterCollateralTransfer = {
  timestamp: number;
  signedValueWeiForUser: bigint;
};

async function fetchRouterPrimaryCollateralTransfers(
  account: Address,
  chainId: SupportedChain,
  primaryToken: Address,
  endTime: number,
): Promise<RouterCollateralTransfer[]> {
  const sdk = seerEnvioSdk(chainId);
  const accountLc = account.toLowerCase();
  const tokenLc = primaryToken.toLowerCase();
  const out: RouterCollateralTransfer[] = [];
  let offset = 0;
  for (;;) {
    const { Transfer: rows } = await sdk.GetTransfers({
      limit: PAGE,
      offset,
      orderBy: [{ timestamp: Order_By.Asc }, { logIndex: Order_By.Asc }],
      where: {
        chainId: { _eq: String(chainId) },
        kind: { _eq: "router_collateral" },
        token: { id: { _eq: tokenLc } },
        timestamp: { _lte: String(endTime) },
        _or: [{ from: { _eq: accountLc } }, { to: { _eq: accountLc } }],
      },
    });
    for (const row of rows) {
      const valueWei = BigInt(row.value);
      const toIsUser = row.to.toLowerCase() === accountLc;
      out.push({
        timestamp: Number(row.timestamp),
        signedValueWeiForUser: toIsUser ? valueWei : -valueWei,
      });
    }
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  return out;
}

/**
 * Cumulative user↔router primary collateral (human units) at each startTime and at endTime.
 *
 * HyperIndex `Transfer kind=router_collateral` where the user is `from` or `to`
 * (including wrap paths such as `splitFromDai` / `*ToDai` attributed to the caller).
 */
export async function computeCollateralPortfolioValuesForPeriods(
  account: Address,
  chainId: SupportedChain,
  endTime: number,
  startTimes: number[],
  primaryCollateral: Token,
): Promise<{ valueEnd: number; valueStartByStartTime: Map<number, number> }> {
  const transfers = await fetchRouterPrimaryCollateralTransfers(account, chainId, primaryCollateral.address, endTime);

  const uniqueStarts = [...new Set(startTimes)].sort((a, b) => a - b);
  const valueStartByStartTime = new Map<number, number>();
  let idx = 0;
  let sumWei = 0n;
  for (const S of uniqueStarts) {
    while (idx < transfers.length && transfers[idx].timestamp <= S) {
      sumWei += transfers[idx].signedValueWeiForUser;
      idx++;
    }
    valueStartByStartTime.set(S, Number(formatUnits(sumWei, primaryCollateral.decimals)));
  }
  while (idx < transfers.length && transfers[idx].timestamp <= endTime) {
    sumWei += transfers[idx].signedValueWeiForUser;
    idx++;
  }
  return {
    valueEnd: Number(formatUnits(sumWei, primaryCollateral.decimals)),
    valueStartByStartTime,
  };
}

export type ConditionalEventRow = {
  marketId: string;
  marketName: string;
  eventType: "split" | "merge" | "redeem";
  amount: bigint;
  collateral: Address;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
};

const MARKET_ADDRESS_IN_CHUNK = 100;

function chunkValues<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** GraphQL `market.address` filter: single `_eq` or chunked `_in`. */
export function conditionalEventMarketFilters(
  marketAddress?: Address,
  marketAddresses?: Address[],
): Array<Record<string, unknown>> {
  if (marketAddresses) {
    const unique = [...new Set(marketAddresses.map((id) => id.toLowerCase()))];
    if (unique.length === 0) return [];
    if (unique.length === 1) return [{ market: { address: { _eq: unique[0] } } }];
    return chunkValues(unique, MARKET_ADDRESS_IN_CHUNK).map((chunk) => ({
      market: { address: { _in: chunk } },
    }));
  }
  if (marketAddress) {
    return [{ market: { address: { _eq: marketAddress.toLowerCase() } } }];
  }
  return [{}];
}

export async function fetchConditionalEventsForAccount(
  account: Address,
  chainId: SupportedChain,
  opts?: { startTime?: number; endTime?: number; marketAddress?: Address; marketAddresses?: Address[] },
): Promise<ConditionalEventRow[]> {
  const sdk = seerEnvioSdk(chainId);
  const accountLc = account.toLowerCase();
  const out: ConditionalEventRow[] = [];
  const timestampFilter =
    opts?.startTime != null || opts?.endTime != null
      ? {
          ...(opts?.startTime != null ? { _gt: String(opts.startTime) } : {}),
          ...(opts?.endTime != null ? { _lte: String(opts.endTime) } : {}),
        }
      : undefined;
  const marketFilters = conditionalEventMarketFilters(opts?.marketAddress, opts?.marketAddresses);
  if (marketFilters.length === 0) return out;

  for (const marketFilter of marketFilters) {
    let offset = 0;
    for (;;) {
      const { ConditionalEvent: rows } = await sdk.GetConditionalEvents({
        limit: PAGE,
        offset,
        orderBy: [{ timestamp: Order_By.Asc }],
        where: {
          chainId: { _eq: String(chainId) },
          accountId: { _eq: accountLc },
          ...(timestampFilter ? { timestamp: timestampFilter } : {}),
          ...marketFilter,
        },
      });
      for (const row of rows) {
        if (!row.market) continue;
        out.push({
          marketId: row.market.address,
          marketName: unescapeJson(row.market.marketName),
          eventType: row.eventType as "split" | "merge" | "redeem",
          amount: BigInt(row.amount),
          collateral: row.collateral as Address,
          timestamp: Number(row.timestamp),
          blockNumber: Number(row.blockNumber),
          transactionHash: row.transactionHash,
        });
      }
      if (rows.length < PAGE) break;
      offset += PAGE;
    }
  }
  return out;
}

export function conditionalEventsToTransactions(events: ConditionalEventRow[]): TransactionData[] {
  return events.map((ev) => {
    const base = {
      marketName: ev.marketName,
      marketId: ev.marketId,
      type: ev.eventType,
      blockNumber: ev.blockNumber,
      collateral: ev.collateral,
      transactionHash: ev.transactionHash,
      timestamp: ev.timestamp,
    };
    return ev.eventType === "redeem"
      ? { ...base, payout: ev.amount.toString() }
      : { ...base, amount: ev.amount.toString() };
  });
}

/**
 * Net primary collateral for the user from ConditionalEvents:
 * split → −amount, merge/redeem → +amount (only legs whose collateral matches primary).
 */
export function routerPrimaryNetFromConditionalEvents(
  events: ConditionalEventRow[],
  primaryCollateral: Token,
): { netHuman: number; transactionEvents: TransactionData[] } {
  const primaryLc = primaryCollateral.address.toLowerCase();
  const matching = events.filter((ev) => ev.collateral.toLowerCase() === primaryLc);
  let netWei = 0n;
  for (const ev of matching) {
    if (ev.eventType === "split") {
      netWei -= ev.amount;
    } else {
      netWei += ev.amount;
    }
  }
  return {
    netHuman: Number(formatUnits(netWei, primaryCollateral.decimals)),
    transactionEvents: conditionalEventsToTransactions(matching),
  };
}

/** Apply balance map onto current positions (same token metadata). */
export function positionsWithBalances(
  positionsNow: PortfolioPosition[],
  balanceByToken: Map<string, bigint>,
  chainId: SupportedChain,
): PortfolioPosition[] {
  const tokenIds = positionsNow.map((p) => p.tokenId.toLowerCase() as Address);
  const decimalsByToken = getTokenDecimals(chainId, tokenIds);
  return positionsNow.map((pos) => {
    const startWei = balanceByToken.get(pos.tokenId.toLowerCase()) ?? 0n;
    const decimals = decimalsByToken[pos.tokenId.toLowerCase()] ?? 18;
    return {
      ...pos,
      tokenBalance: Number(formatUnits(startWei, decimals)),
      rawBalance: startWei.toString(),
    };
  });
}
