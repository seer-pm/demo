import {
  GetPoolHourDatasDocument,
  GetPoolHourDatasQuery,
  OrderDirection,
  PoolHourData_OrderBy,
  getSdk,
} from "@/hooks/queries/gql-generated-swapr";
import { SupportedChain } from "@/lib/chains";
import { getToken0Token1 } from "@/lib/market";
import { swaprGraphQLClient } from "@/lib/subgraph";
import combineQuery from "graphql-combine-query";
import { getTokenPricesMapping } from "../utils";
import { PortfolioPosition } from "./usePortfolioPositions";

export async function getSwaprHistoryTokensPrices(
  positions: PortfolioPosition[],
  chainId: SupportedChain,
  startTime: number,
) {
  if (positions.length === 0) {
    return {};
  }
  const subgraphClient = swaprGraphQLClient(chainId, "algebra");

  if (!subgraphClient) {
    throw new Error("Subgraph not available");
  }

  const { document, variables } = (() =>
    combineQuery("GetPoolHourDatas").addN(
      GetPoolHourDatasDocument,
      positions.map(({ tokenId, collateralToken }) => {
        return {
          first: 1,
          orderBy: PoolHourData_OrderBy.PeriodStartUnix,
          orderDirection: OrderDirection.Desc,
          where: {
            pool_: getToken0Token1(tokenId, collateralToken),
            periodStartUnix_lte: startTime,
            periodStartUnix_gte: startTime - 60 * 60 * 24 * 30 * 3,
          },
        };
      }),
    ))();

  const poolHourDatas = Object.values(
    await subgraphClient.request<Record<string, GetPoolHourDatasQuery["poolHourDatas"]>>(document, variables),
  )
    .map((d) => d?.[0])
    .filter((x) => x);
  return getTokenPricesMapping(
    positions,
    poolHourDatas.map((data) => {
      return {
        ...data.pool,
        token0Price: data.token0Price,
        token1Price: data.token1Price,
      };
    }),
    chainId,
  );
}

export async function getSwaprCurrentTokensPrices(positions: PortfolioPosition[], chainId: SupportedChain) {
  if (positions.length === 0) {
    return {};
  }
  const subgraphClient = swaprGraphQLClient(chainId, "algebra");
  if (!subgraphClient) {
    throw new Error("Subgraph not available");
  }

  const { pools } = await getSdk(subgraphClient).GetPools({
    where: {
      or: positions.reduce(
        (acc, { tokenId }) => {
          acc.push({ token0: tokenId.toLocaleLowerCase() }, { token1: tokenId.toLocaleLowerCase() });
          return acc;
        },
        [] as { [key: string]: string }[],
      ),
    },
  });

  return getTokenPricesMapping(positions, pools, chainId);
}
