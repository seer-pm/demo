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
 * Paginate with timestamp+id cursor until exhausted. Dedupes by `id`.
 */
export async function paginateByTimestampId<T extends TimestampIdPageItem>(args: {
  pageSize?: number;
  fetchPage: (where: Record<string, unknown>, first: number) => Promise<T[]>;
  accountFilters: Record<string, unknown>[];
  startTime?: number;
  endTime?: number;
}): Promise<T[]> {
  const pageSize = args.pageSize ?? 1000;
  const out: T[] = [];
  const seen = new Set<string>();
  let cursor: TimestampIdCursor | undefined;
  const endInclusive = args.endTime?.toString();

  for (;;) {
    const where = buildTimestampIdPageWhere({
      accountFilters: args.accountFilters,
      startTime: args.startTime,
      endInclusive: cursor ? undefined : endInclusive,
      cursor,
    });

    const page = await args.fetchPage(where, pageSize);
    if (page.length === 0) break;

    let added = 0;
    for (const item of page) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
      added += 1;
    }

    const last = page[page.length - 1];
    const nextCursor: TimestampIdCursor = { timestamp: last.timestamp, id: last.id };
    if (
      page.length < pageSize ||
      (cursor && cursor.timestamp === nextCursor.timestamp && cursor.id === nextCursor.id) ||
      added === 0
    ) {
      break;
    }
    cursor = nextCursor;
  }

  return out;
}
