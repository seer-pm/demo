import { getTokenPricesMapping } from "@/hooks/portfolio/utils";
import {
  GetPoolHourDatasDocument,
  GetPoolHourDatasQuery,
  OrderDirection,
  PoolHourData_OrderBy,
} from "@/hooks/queries/gql-generated-swapr";
import { SupportedChain, gnosis } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import combineQuery from "graphql-combine-query";

export async function getPrices(
  tokens: { tokenId: string; parentTokenId?: string }[] | undefined,
  chainId: SupportedChain,
  startTime: number,
) {
  if (!tokens?.length) return {};
  const subgraphClient = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);

  if (!subgraphClient) {
    throw new Error("Subgraph not available");
  }
  const BATCH_SIZE = chainId === gnosis.id ? 10 : 1;
  const batches = [];
  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    batches.push(tokens.slice(i, i + BATCH_SIZE));
  }
  const results = [];
  for (const batch of batches) {
    const { document, variables } = combineQuery("GetPoolHourDatas").addN(
      GetPoolHourDatasDocument,
      batch.map(({ tokenId, parentTokenId }) => {
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
            periodStartUnix_gte: startTime - 60 * 60 * 24 * 30 * 1,
          },
        };
      }),
    );

    const batchResult = Object.values(
      await subgraphClient.request<Record<string, GetPoolHourDatasQuery["poolHourDatas"]>>(document, variables),
    )
      .map((d) => d?.[0])
      .filter((x) => x);
    results.push(...batchResult);
  }

  return getTokenPricesMapping(
    tokens,
    results.map((data) => {
      return {
        ...data.pool,
        token0Price: data.token0Price,
        token1Price: data.token1Price,
      };
    }),
    chainId as number,
  );
}
