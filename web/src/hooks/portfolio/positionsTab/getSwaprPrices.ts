import {
  GetPoolHourDatasDocument,
  GetPoolHourDatasQuery,
  OrderDirection,
  PoolHourData_OrderBy,
  getSdk,
} from "@/hooks/queries/gql-generated-swapr";
import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { swaprGraphQLClient } from "@/lib/subgraph";
import combineQuery from "graphql-combine-query";
import { getTokenPricesMapping } from "../utils";

export async function getSwaprHistoryTokensPrices(
  tokens: { tokenId: string; parentTokenId?: string }[] | undefined,
  chainId: SupportedChain,
  startTime: number,
) {
  if (!tokens?.length) return {};
  const subgraphClient = swaprGraphQLClient(chainId, "algebra");

  if (!subgraphClient) {
    throw new Error("Subgraph not available");
  }

  const { document, variables } = (() =>
    combineQuery("GetPoolHourDatas").addN(
      GetPoolHourDatasDocument,
      tokens.map(({ tokenId, parentTokenId }) => {
        const collateral = parentTokenId
          ? parentTokenId.toLocaleLowerCase()
          : COLLATERAL_TOKENS[chainId].primary.address.toLocaleLowerCase();
        return {
          first: 1,
          orderBy: PoolHourData_OrderBy.PeriodStartUnix,
          orderDirection: OrderDirection.Desc,
          where: {
            pool_:
              tokenId.toLocaleLowerCase() > collateral
                ? { token1: tokenId.toLocaleLowerCase(), token0: collateral }
                : { token0: tokenId.toLocaleLowerCase(), token1: collateral },
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
    tokens,
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

export async function getSwaprCurrentTokensPrices(
  tokens: { tokenId: string; parentTokenId?: string }[] | undefined,
  chainId: SupportedChain,
) {
  if (!tokens) return {};
  const subgraphClient = swaprGraphQLClient(chainId, "algebra");
  if (!subgraphClient) {
    throw new Error("Subgraph not available");
  }

  const { pools } = await getSdk(subgraphClient).GetPools({
    where: {
      or: tokens.reduce(
        (acc, { tokenId }) => {
          acc.push({ token0: tokenId.toLocaleLowerCase() }, { token1: tokenId.toLocaleLowerCase() });
          return acc;
        },
        [] as { [key: string]: string }[],
      ),
    },
  });

  return getTokenPricesMapping(tokens, pools, chainId);
}
