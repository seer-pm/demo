import type { SupportedChain } from "@seer-pm/sdk";
import { getToken0Token1 } from "@seer-pm/sdk/market-pools";
import type { Token0Token1 } from "@seer-pm/sdk/market-pools";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import pLimit from "p-limit";
import type { Address } from "viem";
import { Database } from "../supabase";
import { START_TIME } from "./constants";

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

export async function getPoolHourDatasByTokenPair(chainId: SupportedChain, tokenPair: Token0Token1) {
  let allData: PoolHourData[] = [];

  const initialPeriodStartUnix = START_TIME[chainId as 1 | 100];
  let currentPeriodStartUnix = initialPeriodStartUnix;

  const PAGE_SIZE = 1000;
  const maxRetries = 3;

  while (true) {
    let retries = 0;
    let success = false;
    let poolHourDatas: PoolHourData[] = [];

    while (retries < maxRetries && !success) {
      try {
        const { data, error } = await supabase
          .from("dex_pool_hour_prices")
          .select("*")
          .eq("chain_id", chainId)
          .eq("token0_id", tokenPair.token0.toLowerCase())
          .eq("token1_id", tokenPair.token1.toLowerCase())
          .gt("period_start_unix", currentPeriodStartUnix)
          .order("period_start_unix", { ascending: true })
          .limit(PAGE_SIZE);

        if (error) {
          throw error;
        }

        poolHourDatas = (data ?? []).map(mapRowToPoolHourData);

        success = true;
      } catch (error) {
        retries++;

        if (retries === maxRetries) {
          throw new Error(
            `Max retries reached for periodStartUnix ${currentPeriodStartUnix}. ${(error as Error).message}`,
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** retries));
      }
    }

    allData = allData.concat(poolHourDatas);

    if (
      poolHourDatas.length === 0 ||
      poolHourDatas[poolHourDatas.length - 1]?.periodStartUnix === currentPeriodStartUnix
    ) {
      break;
    }

    if (poolHourDatas.length < PAGE_SIZE) {
      break;
    }

    currentPeriodStartUnix = poolHourDatas[poolHourDatas.length - 1]?.periodStartUnix;

    await new Promise((res) => setTimeout(res, 300));
  }

  return allData;
}

export async function getAllPoolHourDatas(chainId: SupportedChain, initialStartTime?: number) {
  const PAGE_SIZE = 1000;

  const [{ data: earliestData, error: earliestError }, { data: latestData, error: latestError }] = await Promise.all([
    supabase
      .from("dex_pool_hour_prices")
      .select("period_start_unix")
      .eq("chain_id", chainId)
      .order("period_start_unix", { ascending: true })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("dex_pool_hour_prices")
      .select("period_start_unix")
      .eq("chain_id", chainId)
      .order("period_start_unix", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (earliestError) {
    throw earliestError;
  }

  if (latestError) {
    throw latestError;
  }

  const startTime = initialStartTime ?? earliestData?.period_start_unix ?? 0;

  const endTime = latestData?.period_start_unix ?? 0;

  const CHUNK_SIZE = 24 * 60 * 60;

  const chunks: Promise<PoolHourData[]>[] = [];
  const limit = pLimit(10);

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
  let allData: PoolHourData[] = [];
  let currentTimestamp = startTime;

  while (currentTimestamp < endTime) {
    const { data, error } = await supabase
      .from("dex_pool_hour_prices")
      .select("*")
      .eq("chain_id", chainId)
      .gte("period_start_unix", currentTimestamp)
      .lt("period_start_unix", endTime)
      .order("period_start_unix", { ascending: true })
      .limit(pageSize);

    if (error) {
      throw error;
    }

    const mappedData = (data ?? []).map(mapRowToPoolHourData);

    allData = allData.concat(mappedData);

    if (mappedData.length < pageSize) {
      break;
    }

    currentTimestamp = Number(mappedData[mappedData.length - 1].periodStartUnix) + 1;
  }

  return allData;
}

export async function getPoolHourDatasByTokenPairs(
  chainId: SupportedChain,
  tokenPairs: { tokenId: Address; parentTokenId?: Address; collateralToken: Address }[],
) {
  const limit = pLimit(10);

  const sortedTokenPairs = tokenPairs.map(({ tokenId, parentTokenId, collateralToken }) => {
    const collateral = (parentTokenId ?? collateralToken).toLowerCase();
    return getToken0Token1(tokenId, collateral as Address);
  });

  const promises = sortedTokenPairs.map((tokenPair) => limit(() => getPoolHourDatasByTokenPair(chainId, tokenPair)));

  const allData = (await Promise.all(promises)).flat();

  allData.sort((a, b) => Number(b.periodStartUnix) - Number(a.periodStartUnix));

  return allData;
}
