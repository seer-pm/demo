/**
 * Lexicographic (timestamp desc, id desc) pagination for The Graph-style Swap/Mint/Burn filters.
 * Secondary key lives in `where` because these schemas only accept a single `orderBy` enum.
 */

export type TimestampIdCursor = {
  timestamp: string;
  id: string;
};

export type TimestampIdPageItem = {
  id: string;
  timestamp: string;
};

/**
 * Row cap shared by the event fetchers of a single request.
 *
 * Latency here scales with row count, not with the requested time window, so the cap is what
 * bounds the work — a narrow date range does nothing for an account that traded heavily inside
 * it. Any leg that hits its cap sets `truncated`, which the handler surfaces to the client so
 * the UI can say the list is partial instead of looking empty.
 */
export type EventFetchOptions = {
  /** Max raw rows per source. Undefined or <= 0 means fetch to exhaustion (previous behaviour). */
  limit?: number;
  /** Set by any leg that stopped at its cap. Shared across the legs of one request. */
  truncated?: boolean;
};

/** True when `rows` came back at the cap, i.e. there are probably older rows we didn't fetch. */
export function hitLimit(rows: { length: number }, limit: number | undefined): boolean {
  return limit !== undefined && limit > 0 && rows.length >= limit;
}

/** Build `and` clauses for address match + time window + optional (timestamp, id) cursor. */
export function buildTimestampIdPageWhere(args: {
  accountFilters: Record<string, unknown>[];
  startTime?: number;
  /** Inclusive upper bound for the first page (typically endTime). */
  endInclusive?: string;
  cursor?: TimestampIdCursor;
}): Record<string, unknown> {
  const and: Record<string, unknown>[] = [];

  if (args.accountFilters.length === 1) {
    and.push(args.accountFilters[0]);
  } else if (args.accountFilters.length > 1) {
    and.push({ or: args.accountFilters });
  }

  if (args.startTime != null) {
    and.push({ timestamp_gte: args.startTime.toString() });
  }

  if (args.cursor) {
    and.push({
      or: [
        { timestamp_lt: args.cursor.timestamp },
        { and: [{ timestamp: args.cursor.timestamp }, { id_lt: args.cursor.id }] },
      ],
    });
  } else if (args.endInclusive != null) {
    and.push({ timestamp_lte: args.endInclusive });
  }

  return { and };
}

/**
 * Paginate with timestamp+id cursor until exhausted, or until `maxRows` is reached. Dedupes by `id`.
 *
 * Rows come back newest-first, so stopping early yields the most recent `maxRows`.
 */
export async function paginateByTimestampId<T extends TimestampIdPageItem>(args: {
  pageSize?: number;
  /** Stop once this many rows are collected. Undefined or <= 0 paginates to exhaustion. */
  maxRows?: number;
  fetchPage: (where: Record<string, unknown>, first: number) => Promise<T[]>;
  accountFilters: Record<string, unknown>[];
  startTime?: number;
  endTime?: number;
}): Promise<T[]> {
  const pageSize = args.pageSize ?? 1000;
  const maxRows = args.maxRows !== undefined && args.maxRows > 0 ? args.maxRows : undefined;
  const out: T[] = [];
  const seen = new Set<string>();
  let cursor: TimestampIdCursor | undefined;
  const endInclusive = args.endTime?.toString();

  for (;;) {
    // Never ask for more than we still need, so a small cap costs a small response.
    const first = maxRows === undefined ? pageSize : Math.min(pageSize, maxRows - out.length);
    if (first <= 0) break;

    const where = buildTimestampIdPageWhere({
      accountFilters: args.accountFilters,
      startTime: args.startTime,
      endInclusive: cursor ? undefined : endInclusive,
      cursor,
    });

    const page = await args.fetchPage(where, first);
    if (page.length === 0) break;

    let added = 0;
    for (const item of page) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
      added += 1;
      if (maxRows !== undefined && out.length >= maxRows) break;
    }

    if (maxRows !== undefined && out.length >= maxRows) break;

    const last = page[page.length - 1];
    const nextCursor: TimestampIdCursor = { timestamp: last.timestamp, id: last.id };
    // Compare against `first`, not `pageSize` — a capped final page is short by design.
    if (
      page.length < first ||
      (cursor && cursor.timestamp === nextCursor.timestamp && cursor.id === nextCursor.id) ||
      added === 0
    ) {
      break;
    }
    cursor = nextCursor;
  }

  return out;
}
