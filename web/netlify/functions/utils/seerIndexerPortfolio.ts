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

/** Aliases in `GetTokenBalanceDailiesAtEods`; one round trip resolves this many day boundaries. */
const EOD_SLOTS = 4;
/** Where-clause that matches nothing — fills unused slots and retires exhausted ones. */
const EMPTY_EOD_WHERE = { id: { _eq: "" } };

type EodRow = { token: string; dayStartTimestamp: string; balance: string };

function eodWhere(chainId: SupportedChain, accountLc: string, dayStart: number) {
  return {
    chainId: { _eq: String(chainId) },
    account: { _eq: accountLc },
    dayStartTimestamp: { _lte: String(dayStart) },
  };
}

/**
 * EOD balances for up to `EOD_SLOTS` timestamps in one paginated round trip.
 *
 * `TokenBalanceDaily` is sparse (a row only exists on days with a transfer), so the balance at
 * EOD of day D is the latest row with `dayStartTimestamp <= floorUtcDay(D)`. Hasura
 * `distinct_on: [token]` with `order_by: [{token}, {dayStartTimestamp: desc}]` returns exactly
 * that row per token, so each boundary costs one bounded query instead of paginating the
 * account's entire daily history and reducing in memory.
 *
 * `tokens` is still applied in memory: the filter is over the account's distinct tokens (not its
 * lifetime of rows), and an `_in` of every wrapped token would be an oversized payload.
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

  const tokenSet = new Set(tokens.map((t) => t.toLowerCase()));
  const sdk = seerEnvioSdk(chainId);
  const accountLc = account.toLowerCase();

  for (let i = 0; i < uniqueEods.length; i += EOD_SLOTS) {
    const slots = uniqueEods.slice(i, i + EOD_SLOTS);
    // `distinct_on` is applied per boundary, so a page is one row per token — never per day.
    const done = slots.map(() => false);
    let offset = 0;

    while (done.some((d) => !d)) {
      const where = (slot: number) =>
        slot < slots.length && !done[slot] ? eodWhere(chainId, accountLc, floorUtcDay(slots[slot])) : EMPTY_EOD_WHERE;

      const page = await sdk.GetTokenBalanceDailiesAtEods({
        limit: PAGE,
        offset,
        where0: where(0),
        where1: where(1),
        where2: where(2),
        where3: where(3),
      });
      const pages: EodRow[][] = [page.eod0, page.eod1, page.eod2, page.eod3];

      for (let slot = 0; slot < slots.length; slot++) {
        if (done[slot]) continue;
        const rows = pages[slot] ?? [];
        const balances = out.get(slots[slot])!;
        for (const row of rows) {
          const token = row.token.toLowerCase();
          if (!tokenSet.has(token)) continue;
          balances.set(token, BigInt(row.balance));
        }
        if (rows.length < PAGE) done[slot] = true;
      }
      offset += PAGE;
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

export type RouterCollateralTransfer = {
  timestamp: number;
  signedValueWeiForUser: bigint;
  transactionHash: string;
};

/**
 * Every user↔router primary-collateral transfer up to `endTime`, oldest first.
 *
 * Exported so a caller that needs both derived views (`computeCollateralPortfolioValuesForPeriods`
 * and `fetchRouterCollateralTransactionHashes`) pays for the paginated scan once.
 */
export async function fetchRouterPrimaryCollateralTransfers(
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
        transactionHash: row.transactionHash,
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
  /** Pass an already-fetched list to skip the scan; omit to fetch. */
  prefetchedTransfers?: RouterCollateralTransfer[],
): Promise<{ valueEnd: number; valueStartByStartTime: Map<number, number> }> {
  const transfers =
    prefetchedTransfers ??
    (await fetchRouterPrimaryCollateralTransfers(account, chainId, primaryCollateral.address, endTime));

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

/**
 * Transactions where primary collateral moved between this account and a Seer router.
 *
 * Needed because `ConditionalEvent.accountId` does **not** always identify the economic owner. When
 * the CTF stakeholder is the router, the indexer rewrites `accountId` to `transaction.from`
 * (`resolveAccountId`). That is right when the user signs their own transaction, but a DeepFunding
 * TradeExecutor is driven by a relayer: the collateral leaves the executor while the event is booked
 * to whichever EOA happened to sign. Measured on optimism, 127 of 366 router transfers with an
 * associated event (35%, across 74 addresses) are attributed to an address other than the one whose
 * collateral moved.
 *
 * The `Transfer` follows the money, so its transactions are the reliable ownership signal. The event
 * is still the source of the amount and the market — only the ownership test changes.
 */
export async function fetchRouterCollateralTransactionHashes(
  account: Address,
  chainId: SupportedChain,
  primaryCollateral: Token,
  endTime: number,
  /** Pass an already-fetched list to skip the scan; omit to fetch. */
  prefetchedTransfers?: RouterCollateralTransfer[],
): Promise<string[]> {
  const transfers =
    prefetchedTransfers ??
    (await fetchRouterPrimaryCollateralTransfers(account, chainId, primaryCollateral.address, endTime));
  return [...new Set(transfers.map((t) => t.transactionHash.toLowerCase()))];
}

export type ConditionalEventRow = {
  /** `{chainId}:{txHash}-{logIndex}-{marketEntityId}` — the market suffix is what fans out. */
  id: string;
  marketId: string;
  /** `{chainId}:{address}` — the `Market` entity id, i.e. the suffix of `id`. */
  marketEntityId: string;
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
          id: row.id,
          marketId: row.market.address,
          marketEntityId: row.market.id,
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

const TX_HASH_IN_CHUNK = 100;

/** `ConditionalEvent`s for a set of transactions, regardless of which account they were booked to. */
export async function fetchConditionalEventsByTransactions(
  chainId: SupportedChain,
  transactionHashes: string[],
  opts?: { startTime?: number; endTime?: number },
): Promise<ConditionalEventRow[]> {
  const unique = [...new Set(transactionHashes.map((h) => h.toLowerCase()))];
  if (unique.length === 0) return [];

  const sdk = seerEnvioSdk(chainId);
  const out: ConditionalEventRow[] = [];
  const timestampFilter =
    opts?.startTime != null || opts?.endTime != null
      ? {
          ...(opts?.startTime != null ? { _gt: String(opts.startTime) } : {}),
          ...(opts?.endTime != null ? { _lte: String(opts.endTime) } : {}),
        }
      : undefined;

  for (const chunk of chunkValues(unique, TX_HASH_IN_CHUNK)) {
    let offset = 0;
    for (;;) {
      const { ConditionalEvent: rows } = await sdk.GetConditionalEvents({
        limit: PAGE,
        offset,
        orderBy: [{ timestamp: Order_By.Asc }],
        where: {
          chainId: { _eq: String(chainId) },
          transactionHash: { _in: chunk },
          ...(timestampFilter ? { timestamp: timestampFilter } : {}),
        },
      });
      for (const row of rows) {
        if (!row.market) continue;
        out.push({
          id: row.id,
          marketId: row.market.address,
          marketEntityId: row.market.id,
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
 * Leg key for a `ConditionalEvent` — the CTF event it came from, without the market fan-out.
 *
 * The indexer emits one `ConditionalEvent` **per Market sharing the condition's
 * `conditionId` + `parentCollectionId`** (`handlers/conditionalTokens.ts`), all carrying the same
 * `amount`, while the economic router leg is emitted once. Summing per market without collapsing
 * these would multiply the amount by the size of the duplicate group (observed: 5×).
 *
 * The id ends in `-{marketEntityId}`; stripping that exact suffix is precise and degrades to "no
 * dedupe" rather than to a wrong grouping if the id format ever changes.
 *
 * Returns `""` when the row carries no id — not groupable. Callers must treat that as "keep as is":
 * grouping unidentifiable legs together would merge unrelated events, which is worse than the
 * overcount this function exists to prevent.
 */
export function conditionalEventLegKey(row: Pick<ConditionalEventRow, "id" | "marketEntityId">): string {
  if (!row.id) return "";
  const suffix = `-${row.marketEntityId}`;
  return row.id.endsWith(suffix) ? row.id.slice(0, -suffix.length) : row.id;
}

/**
 * Collapse fanned-out legs to one row each, so an amount is attributed to exactly one market.
 *
 * Attribution, in order: the market the caller already knows this wallet touched (positions ∪ swaps
 * ∪ transfers, or the requested scope), then the lowest market address for determinism — the same
 * leg must always land on the same market or `Σ per-market` stops being reproducible.
 *
 * This is a workaround for an indexer-side issue; the canonical fix is to emit the primary leg once
 * (R0). Until then this is the only thing standing between per-market sums and a 5× overcount.
 */
export function dedupeConditionalEventLegs(
  events: ConditionalEventRow[],
  preferMarketIds?: Iterable<string>,
): { events: ConditionalEventRow[]; fannedOutLegs: number } {
  const preferred = new Set([...(preferMarketIds ?? [])].map((id) => id.toLowerCase()));
  const byLeg = new Map<string, ConditionalEventRow[]>();
  const order: string[] = [];

  const ungroupable: ConditionalEventRow[] = [];
  for (const event of events) {
    const key = conditionalEventLegKey(event);
    if (!key) {
      ungroupable.push(event);
      continue;
    }
    const group = byLeg.get(key);
    if (group) {
      group.push(event);
    } else {
      byLeg.set(key, [event]);
      order.push(key);
    }
  }

  let fannedOutLegs = 0;
  const out: ConditionalEventRow[] = [];
  for (const key of order) {
    const group = byLeg.get(key)!;
    if (group.length === 1) {
      out.push(group[0]);
      continue;
    }
    fannedOutLegs += 1;
    const candidates = [...group].sort((a, b) => a.marketId.toLowerCase().localeCompare(b.marketId.toLowerCase()));
    out.push(candidates.find((e) => preferred.has(e.marketId.toLowerCase())) ?? candidates[0]);
  }

  return { events: [...out, ...ungroupable], fannedOutLegs };
}

export type RouterPrimaryMarketCumulative = {
  /** Signed primary collateral from the router, cumulative to the sweep time: split −, merge/redeem +. */
  netWei: bigint;
  /** Gross split side only — ROI capital needs deployment, not deployment netted against return. */
  splitGrossWei: bigint;
};

/**
 * Cumulative primary router collateral per market, sampled at each of `times`.
 *
 * This is what collapses the two P/L formulas into one. The global path folds router legs into
 * `value*` as a running balance; the market-scoped path adds the in-window net as a separate term.
 * They are the same quantity, because `net_in_window ≡ cum(end) − cum(start)` — so storing the
 * cumulative per market makes every window a subtraction and `Σ per-market` reproduce the global.
 *
 * Legs are deduped first: without that, a market fan-out is counted once per duplicate.
 * Only legs whose collateral is the primary token count; on a conditional market the split
 * collateral is a *parent outcome token*, whose value is already captured as a position in the
 * parent market.
 *
 * `events` must reach back to (or past) the earliest sampled time — the caller fetches from the
 * `all` window start, which precedes first activity, so the earliest sample is 0 by construction.
 */
export function routerPrimaryCumulativeByMarketAtTimes(
  events: ConditionalEventRow[],
  primaryCollateral: Token,
  times: number[],
  opts?: { preferMarketIds?: Iterable<string> },
): {
  byTime: Map<number, Map<string, RouterPrimaryMarketCumulative>>;
  fannedOutLegs: number;
} {
  const byTime = new Map<number, Map<string, RouterPrimaryMarketCumulative>>();
  const uniqueTimes = [...new Set(times)].sort((a, b) => a - b);
  for (const t of uniqueTimes) byTime.set(t, new Map());

  const { events: deduped, fannedOutLegs } = dedupeConditionalEventLegs(events, opts?.preferMarketIds);
  const primaryLc = primaryCollateral.address.toLowerCase();
  const ordered = deduped
    .filter((ev) => ev.collateral.toLowerCase() === primaryLc)
    .sort((a, b) => a.timestamp - b.timestamp);

  const running = new Map<string, RouterPrimaryMarketCumulative>();
  let idx = 0;
  for (const t of uniqueTimes) {
    while (idx < ordered.length && ordered[idx].timestamp <= t) {
      const ev = ordered[idx];
      const marketId = ev.marketId.toLowerCase();
      const acc = running.get(marketId) ?? { netWei: 0n, splitGrossWei: 0n };
      if (ev.eventType === "split") {
        acc.netWei -= ev.amount;
        acc.splitGrossWei += ev.amount;
      } else {
        acc.netWei += ev.amount;
      }
      running.set(marketId, acc);
      idx++;
    }
    // Snapshot: later sweeps keep mutating `running`, so each sample needs its own copy.
    const snapshot = byTime.get(t)!;
    for (const [marketId, acc] of running) {
      snapshot.set(marketId, { netWei: acc.netWei, splitGrossWei: acc.splitGrossWei });
    }
  }

  return { byTime, fannedOutLegs };
}

/**
 * Net primary collateral for the user from ConditionalEvents:
 * split → −amount, merge/redeem → +amount (only legs whose collateral matches primary).
 *
 * `splitOutHuman` is the **gross** split side of the same legs. ROI capital needs deployment,
 * not the net of deployment and return: a wallet that split and later redeemed nets to ~0,
 * which would leave it with no denominator.
 *
 * Legs are deduped first (`dedupeConditionalEventLegs`): the indexer fans one CTF event out across
 * every Market sharing the condition, so a scope containing two of them used to double-count.
 * `fannedOutLegs` reports how many groups were collapsed, so the correction is observable.
 */
export function routerPrimaryNetFromConditionalEvents(
  events: ConditionalEventRow[],
  primaryCollateral: Token,
  opts?: { preferMarketIds?: Iterable<string> },
): { netHuman: number; splitOutHuman: number; transactionEvents: TransactionData[]; fannedOutLegs: number } {
  const primaryLc = primaryCollateral.address.toLowerCase();
  // Collapse the market fan-out before summing: a scope holding two markets of the same duplicate
  // group would otherwise book the leg twice.
  const { events: deduped, fannedOutLegs } = dedupeConditionalEventLegs(events, opts?.preferMarketIds);
  const matching = deduped.filter((ev) => ev.collateral.toLowerCase() === primaryLc);
  let netWei = 0n;
  let splitOutWei = 0n;
  for (const ev of matching) {
    if (ev.eventType === "split") {
      netWei -= ev.amount;
      splitOutWei += ev.amount;
    } else {
      netWei += ev.amount;
    }
  }
  return {
    netHuman: Number(formatUnits(netWei, primaryCollateral.decimals)),
    splitOutHuman: Number(formatUnits(splitOutWei, primaryCollateral.decimals)),
    transactionEvents: conditionalEventsToTransactions(matching),
    fannedOutLegs,
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
