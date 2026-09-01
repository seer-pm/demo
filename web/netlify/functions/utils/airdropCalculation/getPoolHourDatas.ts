import type { SupportedChain } from "@seer-pm/sdk";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import pLimit from "p-limit";
import { Database } from "../supabase";
import { withRetry } from "../withRetry";

const supabase: SupabaseClient<Database> = createClient<Database>(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_API_KEY!,
);

export type PoolHourData = {
  id: string;
  token0Price: string;
  token1Price: string;
  periodStartUnix: number;
  sqrtPrice: string | null;
  liquidity: string | null;
  pool: {
    id: string;
    liquidity: string | null;
    token0: {
      id: string;
      name: string | null;
    };
    token1: {
      id: string;
      name: string | null;
    };
  };
};

function mapRowToPoolHourData(row: Database["public"]["Tables"]["dex_pool_hour_prices"]["Row"]): PoolHourData {
  return {
    id: `${row.pool_id}-${row.period_start_unix}`,
    token0Price: String(row.token0_price),
    token1Price: String(row.token1_price),
    periodStartUnix: row.period_start_unix,
    sqrtPrice: null,
    liquidity: null,
    pool: {
      id: row.pool_id,
      liquidity: null,
      token0: {
        id: row.token0_id,
        name: null,
      },
      token1: {
        id: row.token1_id,
        name: null,
      },
    },
  };
}

export async function getAllPoolHourDatas(chainId: SupportedChain, initialStartTime?: number) {
  const PAGE_SIZE = 1000;

  const [earliestData, latestData] = await Promise.all([
    withRetry(async () => {
      const res = await supabase
        .from("dex_pool_hour_prices")
        .select("period_start_unix")
        .eq("chain_id", chainId)
        .order("period_start_unix", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (res.error) throw res.error;
      return res.data;
    }, "poolhour.earliest"),

    withRetry(async () => {
      const res = await supabase
        .from("dex_pool_hour_prices")
        .select("period_start_unix")
        .eq("chain_id", chainId)
        .order("period_start_unix", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (res.error) throw res.error;
      return res.data;
    }, "poolhour.latest"),
  ]);

  const startTime = initialStartTime ?? earliestData?.period_start_unix ?? 0;

  const endTime = latestData?.period_start_unix ?? 0;

  const CHUNK_SIZE = 24 * 60 * 60;

  const chunks: Promise<PoolHourData[]>[] = [];
  const limit = pLimit(4);

  for (let time = startTime; time < endTime; time += CHUNK_SIZE) {
    chunks.push(
      limit(() => fetchPoolHourDatasTimeRange(chainId, time, Math.min(time + CHUNK_SIZE, endTime), PAGE_SIZE)),
    );
  }

  const results = await Promise.all(chunks);

  const allData = results.flat();

  allData.sort((a, b) => Number(b.periodStartUnix) - Number(a.periodStartUnix));

  return allData;
}

async function fetchPoolHourDatasTimeRange(
  chainId: SupportedChain,
  startTime: number,
  endTime: number,
  pageSize = 1000,
): Promise<PoolHourData[]> {
  const allData: PoolHourData[] = [];

  // Offset paging over a TOTAL order, not a cursor on period_start_unix alone.
  //
  // The primary key is (chain_id, pool_id, period_start_unix), so one hour holds one row per pool.
  // The previous cursor advanced to `last.period_start_unix + 1`, and because period_start_unix is
  // hour-aligned that skipped every remaining row of whatever hour a page happened to end in — up
  // to ~45% of Optimism's candles, which has ~22k rows in a single 24h chunk. Ordering by pool_id
  // as well makes the order total, so offsets are stable and nothing is skipped or duplicated.
  let offset = 0;
  for (;;) {
    const data = await withRetry(async () => {
      const res = await supabase
        .from("dex_pool_hour_prices")
        .select("*")
        .eq("chain_id", chainId)
        .gte("period_start_unix", startTime)
        .lt("period_start_unix", endTime)
        .order("period_start_unix", { ascending: true })
        .order("pool_id", { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (res.error) throw res.error;
      return res.data;
    }, "poolhour.range");

    const mapped = (data ?? []).map(mapRowToPoolHourData);
    // Stop on an empty page and advance by what actually arrived, rather than breaking on a short
    // page: the gateway caps responses independently of the requested range, so a short page is
    // not evidence of the end. Breaking on it would be the same class of silent truncation as the
    // cursor this replaces.
    if (mapped.length === 0) {
      break;
    }
    for (const row of mapped) {
      allData.push(row);
    }
    offset += mapped.length;
  }

  return allData;
}
