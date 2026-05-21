import type { GetPoolHourDatasQuery } from "../generated/subgraph/swapr";
import type { Market } from "./market-types";
import { getApiHost } from "./subgraph/app-subgraph";

export type PoolHourDatasSets = GetPoolHourDatasQuery["poolHourDatas"][];

export async function fetchChartData(market: Market): Promise<PoolHourDatasSets> {
  const params = new URLSearchParams();
  params.append("marketId", market.id);
  params.append("chainId", market.chainId.toString());

  const response = await fetch(`${getApiHost()}/.netlify/functions/market-chart?${params.toString()}`);
  return response.json();
}
