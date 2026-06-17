import type { GetPoolHourDatasQuery } from "../generated/subgraph/swapr";
import type { Market } from "./market-types";
import { getApiHost } from "./subgraph/app-subgraph";

export type PoolHourDatasSets = GetPoolHourDatasQuery["poolHourDatas"][];

export async function fetchChartData(market: Market, options?: { fresh?: boolean }): Promise<PoolHourDatasSets> {
  const params = new URLSearchParams();
  params.append("marketId", market.id);
  params.append("chainId", market.chainId.toString());
  if (options?.fresh) {
    params.append("fresh", "true");
  }

  const response = await fetch(`${getApiHost()}/.netlify/functions/market-chart?${params.toString()}`);
  return response.json();
}
