import type { Address } from "viem";
import type { Token } from "../collateral";
import { tickToPrice } from "../liquidity-utils";
import { getToken0Token1 } from "../market-pools";
import { swaprGraphQLClient, uniswapGraphQLClient } from "./app-subgraph";
import { getSdk as getSwaprSdk } from "./generated/gql-generated-swapr";
import { OrderDirection, Pool_OrderBy } from "./generated/gql-generated-swapr";
import { getSdk as getUniswapSdk } from "./generated/gql-generated-uniswap";
import { CHAIN_IDS } from "./subgraph-endpoints";

export async function getTokenPriceFromSubgraph(
  wrappedAddress: Address,
  collateralToken: Token,
  chainId: number,
): Promise<number> {
  const subgraphClient =
    chainId === CHAIN_IDS.gnosis ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);

  if (!subgraphClient) {
    return Number.NaN;
  }

  try {
    const graphQLSdk = chainId === CHAIN_IDS.gnosis ? getSwaprSdk(subgraphClient) : getUniswapSdk(subgraphClient);
    const { pools } = await graphQLSdk.GetPools({
      where: {
        ...getToken0Token1(wrappedAddress, collateralToken.address),
      },
      // biome-ignore lint/suspicious/noExplicitAny: generated enum cast
      orderBy: Pool_OrderBy.Liquidity as any,
      // biome-ignore lint/suspicious/noExplicitAny: generated enum cast
      orderDirection: OrderDirection.Desc as any,
      first: 1,
    });
    const { token0 } = getToken0Token1(wrappedAddress, collateralToken.address);
    const pool = pools[0];
    if (!pool) {
      return Number.NaN;
    }
    if (pool.tick === null || pool.tick === undefined) {
      return Number.NaN;
    }
    const [price0, price1] = tickToPrice(Number(pool.tick));
    return wrappedAddress.toLowerCase() === token0.toLowerCase() ? Number(price0) : Number(price1);
  } catch (e) {
    console.error(e);
    return Number.NaN;
  }
}
