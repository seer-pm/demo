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

const DEFAULT_PAGE_SIZE = 1000;
const DEFAULT_MAX_PAGES = 20;
const TOKEN_IN_CHUNK = 100;

function chunkIds(ids: string[], size: number): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    out.push(ids.slice(i, i + size));
  }
  return out;
}

/** Build `and` clauses for address match + optional Seer tokens + time window + cursor. */
export function buildTimestampIdPageWhere(args: {
  accountFilters: Record<string, unknown>[];
  tokenIds?: string[];
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

  if (args.tokenIds && args.tokenIds.length > 0) {
    and.push({ or: [{ token0_in: args.tokenIds }, { token1_in: args.tokenIds }] });
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

async function paginateOneStream<T extends TimestampIdPageItem>(args: {
  pageSize: number;
  maxPages: number;
  fetchPage: (where: Record<string, unknown>, first: number) => Promise<T[]>;
  accountFilters: Record<string, unknown>[];
  tokenIds?: string[];
  startTime?: number;
  endTime?: number;
  seen: Set<string>;
  out: T[];
}): Promise<number> {
  let cursor: TimestampIdCursor | undefined;
  const endInclusive = args.endTime?.toString();
  let pages = 0;

  for (;;) {
    if (pages >= args.maxPages) {
      console.warn("dex subgraph pagination hit page cap", {
        pages,
        rows: args.out.length,
        tokenCount: args.tokenIds?.length,
      });
      break;
    }

    const where = buildTimestampIdPageWhere({
      accountFilters: args.accountFilters,
      tokenIds: args.tokenIds,
      startTime: args.startTime,
      endInclusive: cursor ? undefined : endInclusive,
      cursor,
    });

    const page = await args.fetchPage(where, args.pageSize);
    pages += 1;
    if (page.length === 0) break;

    for (const item of page) {
      if (args.seen.has(item.id)) continue;
      args.seen.add(item.id);
      args.out.push(item);
    }

    const last = page[page.length - 1];
    const nextCursor: TimestampIdCursor = { timestamp: last.timestamp, id: last.id };
    if (
      page.length < args.pageSize ||
      (cursor && cursor.timestamp === nextCursor.timestamp && cursor.id === nextCursor.id)
    ) {
      break;
    }
    cursor = nextCursor;
  }

  return pages;
}

/**
 * Paginate with timestamp+id cursor until exhausted. Dedupes by `id`.
 * When `tokenIds` is set, filters `token0_in`/`token1_in` (chunked) so we don't scan the wallet's full DEX history.
 */
export async function paginateByTimestampId<T extends TimestampIdPageItem>(args: {
  pageSize?: number;
  maxPages?: number;
  fetchPage: (where: Record<string, unknown>, first: number) => Promise<T[]>;
  accountFilters: Record<string, unknown>[];
  tokenIds?: string[];
  startTime?: number;
  endTime?: number;
}): Promise<T[]> {
  const pageSize = args.pageSize ?? DEFAULT_PAGE_SIZE;
  const maxPages = args.maxPages ?? DEFAULT_MAX_PAGES;
  const out: T[] = [];
  const seen = new Set<string>();

  const tokenChunks =
    args.tokenIds && args.tokenIds.length > 0
      ? chunkIds([...new Set(args.tokenIds.map((t) => t.toLowerCase()))], TOKEN_IN_CHUNK)
      : [undefined];

  for (let i = 0; i < tokenChunks.length; i++) {
    const tokenIds = tokenChunks[i];
    const pages = await paginateOneStream({
      pageSize,
      maxPages,
      fetchPage: args.fetchPage,
      accountFilters: args.accountFilters,
      tokenIds,
      startTime: args.startTime,
      endTime: args.endTime,
      seen,
      out,
    });
    if (pages >= maxPages) {
      console.warn("dex subgraph pagination stopped early for token chunk", {
        chunkIndex: i,
        chunkCount: tokenChunks.length,
        pages,
        maxPages,
        rows: out.length,
        tokenCount: tokenIds?.length,
      });
    }
  }

  return out;
}
