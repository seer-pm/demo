import { createHash } from "node:crypto";
import type { SupportedChain } from "@seer-pm/sdk";
import { getSubgraphUrl } from "@seer-pm/sdk/subgraph";
import { base, gnosis, mainnet } from "viem/chains";

export type DexPoolHourRow = {
  id: string;
  poolId: string;
  token0Id: string;
  token1Id: string;
  token0Price: string;
  token1Price: string;
  periodStartUnix: number;
};

/** Resume point for partial fetches (outer slice + inner window + pair-batch pagination). */
export type DexPoolHourFetchCursor = {
  /** Outer time slice: exclusive lower bound (poolHourDatas periodStartUnix_gt). */
  period_gt: number;
  /** Outer time slice: inclusive upper bound. */
  period_lte: number;
  /** Full backfill cap (hour-aligned); outer slices advance until this. */
  goal_period_lte: number;
  /** Current inner window: exclusive lower for the active subgraph query. */
  inner_period_gt: number;
  batch_index: number;
  /** Next subgraph `skip` for this inner window batch (resume after `MAX_PAGES_PER_RUN` pages). */
  skip: number;
  pairs_count: number;
  /** SHA-256 hex of canonically sorted (token0, token1) pairs; invalidates resume if the pool set changes. */
  pairs_fingerprint: string;
};

/** Deterministic fingerprint for the set of pools (order-independent). */
export function dexPoolPairsFingerprint(pairs: { token0: string; token1: string }[]): string {
  const sorted = [...pairs].sort((a, b) =>
    a.token0 === b.token0 ? a.token1.localeCompare(b.token1) : a.token0.localeCompare(b.token0),
  );
  const payload = sorted.map((p) => `${p.token0}\0${p.token1}`).join("\0");
  return createHash("sha256").update(payload).digest("hex");
}

const PAGE_SIZE = 1000;
/** Pools per GraphQL `or` branch — smaller ORs reduce indexer load. */
const PAIR_BATCH_SIZE = 150;
/**
 * Max span of each **inner** time window inside a single outer `[sliceGt, sliceLte]` range.
 * The scheduled job passes an outer slice; this function walks `innerGt → innerLte` in steps of
 * at most this many seconds so each `poolHourDatas` query filters a bounded `periodStartUnix`
 * band (lighter on the indexer than one huge range). If the outer slice is narrower than this,
 * one inner window covers the whole outer slice.
 */
const INNER_WINDOW_SEC = 24 * 60 * 60 * 30 * 3;
/**
 * Max GraphQL pages fetched per `fetchPoolHourDatasSince` invocation (each page is up to `PAGE_SIZE` rows).
 * Yields with `nextCursor.skip` set to the next subgraph `skip` so later invocations continue past deep windows
 * instead of re-hitting a fixed offset cap with an unchanged cursor.
 */
const MAX_PAGES_PER_RUN = 20;

function dexSubgraphName(chainId: SupportedChain): "algebra" | "uniswap" {
  return chainId === gnosis.id ? "algebra" : "uniswap";
}

function orBranch(
  periodStartUnixGt: number,
  periodStartUnixLte: number,
  p: { token0: string; token1: string },
): string {
  return `{ periodStartUnix_gt: ${periodStartUnixGt}, periodStartUnix_lte: ${periodStartUnixLte}, pool_: { token0: "${p.token0}", token1: "${p.token1}" } }`;
}

/** `where` branch matching a pool by canonical token0/token1 (no time filter). */
function poolOnlyWhereBranch(p: { token0: string; token1: string }): string {
  return `{ pool_: { token0: "${p.token0}", token1: "${p.token1}" } }`;
}

function periodLabel(sec: number): string {
  return `${sec} (${new Date(sec * 1000).toISOString()})`;
}

export type FetchPoolHourDatasResult = {
  rows: DexPoolHourRow[];
  /** Present when this invocation did not finish the outer slice. */
  nextCursor: DexPoolHourFetchCursor | null;
};

export function parseDexPoolHourFetchCursor(value: unknown): DexPoolHourFetchCursor | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const o = value as Record<string, unknown>;
  if (
    typeof o.period_gt !== "number" ||
    typeof o.period_lte !== "number" ||
    typeof o.goal_period_lte !== "number" ||
    typeof o.inner_period_gt !== "number" ||
    typeof o.batch_index !== "number" ||
    typeof o.skip !== "number" ||
    typeof o.pairs_count !== "number" ||
    typeof o.pairs_fingerprint !== "string" ||
    o.pairs_fingerprint.length === 0 ||
    o.period_gt >= o.period_lte ||
    o.inner_period_gt < o.period_gt ||
    o.inner_period_gt >= o.period_lte ||
    o.batch_index < 0 ||
    o.skip < 0 ||
    !Number.isFinite(o.batch_index) ||
    !Number.isFinite(o.skip)
  ) {
    return null;
  }
  return {
    period_gt: o.period_gt,
    period_lte: o.period_lte,
    goal_period_lte: o.goal_period_lte,
    inner_period_gt: o.inner_period_gt,
    batch_index: o.batch_index,
    skip: o.skip,
    pairs_count: o.pairs_count,
    pairs_fingerprint: o.pairs_fingerprint,
  };
}

function buildPairBatches(pairs: { token0: string; token1: string }[]) {
  const pairBatches: { token0: string; token1: string }[][] = [];
  for (let i = 0; i < pairs.length; i += PAIR_BATCH_SIZE) {
    pairBatches.push(pairs.slice(i, i + PAIR_BATCH_SIZE));
  }
  return pairBatches;
}

type JsonPoolHourResponse = {
  errors?: { message: string }[];
  data?: {
    poolHourDatas?: {
      id: string;
      periodStartUnix: string;
      token0Price: string;
      token1Price: string;
      pool: { id: string; token0: { id: string }; token1: { id: string } };
    }[];
  };
};

type JsonEarliestPoolHourResponse = {
  errors?: { message: string }[];
  data?: {
    poolHourDatas?: { periodStartUnix: string }[];
  };
};

/**
 * Earliest `periodStartUnix` among **our** pools (token0/token1 pairs), via batched `or` queries.
 * Used when local DB has no rows yet. Returns `null` if no pool has hour data, pairs are empty, subgraph URL missing, or any batch fails.
 */
export async function fetchEarliestPoolHourPeriodStartUnix(
  chainId: SupportedChain,
  pairs: { token0: string; token1: string }[],
): Promise<number | null> {
  const url = getSubgraphUrl(dexSubgraphName(chainId), chainId);
  if (!url || pairs.length === 0) {
    return null;
  }

  if (chainId === mainnet.id) {
    return Math.floor(Date.UTC(2024, 0, 1) / 1000);
  }

  if (chainId === base.id) {
    return Math.floor(Date.UTC(2025, 6, 1) / 1000);
  }

  const pairBatches = buildPairBatches(pairs);
  const candidates: number[] = [];

  for (let b = 0; b < pairBatches.length; b++) {
    const batch = pairBatches[b];
    const orInner = batch.map((p) => poolOnlyWhereBranch(p)).join(", ");
    const query = `{
      poolHourDatas(
        first: 1,
        orderBy: periodStartUnix,
        orderDirection: asc,
        where: {
          or: [${orInner}]
        }
      ) {
        periodStartUnix
      }
    }`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) {
        console.warn(
          `fetchEarliestPoolHourPeriodStartUnix chain=${chainId} batch=${b + 1}/${pairBatches.length} HTTP ${res.status}`,
        );
        return null;
      }
      const json = (await res.json()) as JsonEarliestPoolHourResponse;
      if (json.errors?.length) {
        console.warn(
          `fetchEarliestPoolHourPeriodStartUnix chain=${chainId} batch=${b + 1}/${pairBatches.length} GraphQL: ${json.errors[0]?.message ?? "unknown"}`,
        );
        return null;
      }
      const raw = json.data?.poolHourDatas?.[0]?.periodStartUnix;
      if (raw === undefined) {
        continue;
      }
      const n = Number(raw);
      if (Number.isFinite(n)) {
        candidates.push(n);
      }
    } catch (e) {
      console.warn(`fetchEarliestPoolHourPeriodStartUnix chain=${chainId} batch=${b + 1}/${pairBatches.length}`, e);
      return null;
    }
  }

  if (candidates.length === 0) {
    return null;
  }
  return Math.min(...candidates);
}

/**
 * Fetch PoolHourData for pools in `(periodStartUnixGt, periodStartUnixLte]` (one **outer** slice; width is caller-defined).
 * Subdivides that range into **inner windows** (see `INNER_WINDOW_SEC`) so each subgraph request uses a bounded
 * `periodStartUnix` filter. May return `nextCursor` to resume in a later invocation.
 */
export async function fetchPoolHourDatasSince(
  chainId: SupportedChain,
  pairs: { token0: string; token1: string }[],
  sliceGt: number,
  sliceLte: number,
  goalPeriodLte: number,
  resume: DexPoolHourFetchCursor | null,
): Promise<FetchPoolHourDatasResult> {
  const url = getSubgraphUrl(dexSubgraphName(chainId), chainId);
  if (!url || pairs.length === 0) {
    return { rows: [], nextCursor: null };
  }

  if (sliceGt >= sliceLte) {
    return { rows: [], nextCursor: null };
  }

  const pairBatches = buildPairBatches(pairs);
  const fnT0 = Date.now();
  const all: DexPoolHourRow[] = [];

  const pairsFingerprint = dexPoolPairsFingerprint(pairs);
  const rawResume =
    resume && resume.pairs_count === pairs.length && resume.pairs_fingerprint === pairsFingerprint ? resume : null;
  const resumeOk = rawResume;
  if (resume && !resumeOk) {
    console.log(
      `fetchDexPoolHourDatas chain=${chainId} ignoring resume (pairs_count was ${resume.pairs_count}, now ${pairs.length}; fingerprint match=${resume.pairs_fingerprint === pairsFingerprint})`,
    );
  }

  let innerGt = resumeOk !== null ? resumeOk.inner_period_gt : sliceGt;
  if (innerGt < sliceGt) {
    innerGt = sliceGt;
  }
  let startBatch = resumeOk?.batch_index ?? 0;
  let startSkip = resumeOk?.skip ?? 0;
  let pagesThisRun = 0;

  console.log(
    `fetchDexPoolHourDatas chain=${chainId} pairs=${pairs.length} pairBatches=${pairBatches.length} pairBatchSize=${PAIR_BATCH_SIZE} innerWindowSec=${INNER_WINDOW_SEC}`,
  );
  console.log(
    `fetchDexPoolHourDatas chain=${chainId} outer slice periodStartUnix_gt=${periodLabel(sliceGt)} periodStartUnix_lte=${periodLabel(sliceLte)} goalLte=${periodLabel(goalPeriodLte)}`,
  );

  while (innerGt < sliceLte) {
    const innerLte = Math.min(innerGt + INNER_WINDOW_SEC, sliceLte);
    console.log(
      `fetchDexPoolHourDatas chain=${chainId} inner window periodStartUnix_gt=${periodLabel(innerGt)} periodStartUnix_lte=${periodLabel(innerLte)} sliceSec=${innerLte - innerGt}`,
    );

    for (let batchIdx = startBatch; batchIdx < pairBatches.length; batchIdx++) {
      const batchPairs = pairBatches[batchIdx];
      const orInner = batchPairs.map((p) => orBranch(innerGt, innerLte, p)).join(", ");
      let skip = batchIdx === startBatch ? startSkip : 0;

      console.log(
        `fetchDexPoolHourDatas chain=${chainId} pairBatch ${batchIdx + 1}/${pairBatches.length} poolsInBatch=${batchPairs.length} orChars=${orInner.length}`,
      );

      for (;;) {
        if (pagesThisRun >= MAX_PAGES_PER_RUN) {
          return {
            rows: all,
            nextCursor: {
              period_gt: sliceGt,
              period_lte: sliceLte,
              goal_period_lte: goalPeriodLte,
              inner_period_gt: innerGt,
              batch_index: batchIdx,
              skip,
              pairs_count: pairs.length,
              pairs_fingerprint: pairsFingerprint,
            },
          };
        }

        const pageStart = Date.now();
        console.log(
          `fetchDexPoolHourDatas chain=${chainId} request pairBatch=${batchIdx + 1}/${pairBatches.length} first=${PAGE_SIZE} skip=${skip} inner=${periodLabel(innerGt)}…${periodLabel(innerLte)}`,
        );

        const query = `{
      poolHourDatas(
        first: ${PAGE_SIZE},
        skip: ${skip},
        orderBy: periodStartUnix,
        orderDirection: asc,
        where: {
          or: [${orInner}]
        }
      ) {
        id
        periodStartUnix
        token0Price
        token1Price
        pool {
          id
          token0 { id }
          token1 { id }
        }
      }
    }`;

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        if (!res.ok) {
          throw new Error(`DEX subgraph HTTP ${res.status} chain ${chainId}`);
        }
        const json = (await res.json()) as JsonPoolHourResponse;
        if (json.errors?.length) {
          throw new Error(`DEX subgraph GraphQL: ${json.errors[0]?.message ?? "unknown"}`);
        }

        const rawRows = json.data?.poolHourDatas ?? [];
        pagesThisRun++;

        for (const row of rawRows) {
          all.push({
            id: row.id,
            poolId: row.pool.id.toLowerCase(),
            token0Id: row.pool.token0.id.toLowerCase(),
            token1Id: row.pool.token1.id.toLowerCase(),
            token0Price: row.token0Price,
            token1Price: row.token1Price,
            periodStartUnix: Number(row.periodStartUnix),
          });
        }

        const hitPageCap = rawRows.length >= PAGE_SIZE;
        console.log(
          `fetchDexPoolHourDatas chain=${chainId} response pairBatch=${batchIdx + 1}/${pairBatches.length} first=${PAGE_SIZE} skip=${skip} page=${pagesThisRun} batch+${Date.now() - pageStart}ms rows=${rawRows.length} cumulative=${all.length}${hitPageCap ? " (may have more)" : ""}`,
        );

        if (rawRows.length < PAGE_SIZE) {
          break;
        }
        skip += PAGE_SIZE;
      }
    }

    startBatch = 0;
    startSkip = 0;
    innerGt = innerLte;
  }

  console.log(`fetchDexPoolHourDatas chain=${chainId} done totalRows=${all.length} total+${Date.now() - fnT0}ms`);
  return { rows: all, nextCursor: null };
}
