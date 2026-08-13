import { gnosis } from "@/lib/chains";
import type { MarketDataMapping, SupportedChain, TransactionData } from "@seer-pm/sdk";
import { getTokensPairKey } from "@seer-pm/sdk/market-pools";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@seer-pm/sdk/subgraph";
import { Burn_OrderBy, type GetBurnsQuery, OrderDirection, getSdk as getSwaprSdk } from "@seer-pm/sdk/subgraph/swapr";
import { getSdk as getUniswapSdk } from "@seer-pm/sdk/subgraph/uniswap";
import { type Address, parseUnits } from "viem";
import { getCollateralFromDexTx } from "../markets";
import { paginateByTimestampId } from "./subgraphTimestampIdPagination";

async function fetchBurnsFromSubgraph(account: string, chainId: SupportedChain, startTime?: number, endTime?: number) {
  const graphQLClient = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);

  if (!graphQLClient) {
    throw new Error("Subgraph not available");
  }

  const graphQLSdk = chainId === gnosis.id ? getSwaprSdk : getUniswapSdk;
  const accountLc = account.toLowerCase() as Address;

  // Timestamp + id cursor pagination (shared helper); origin-only for LP burns.
  return paginateByTimestampId<GetBurnsQuery["burns"][number]>({
    startTime,
    endTime,
    accountFilters: [{ origin: accountLc }],
    fetchPage: async (where, first) => {
      const data = await graphQLSdk(graphQLClient).GetBurns({
        first,
        // biome-ignore lint/suspicious/noExplicitAny:
        orderBy: Burn_OrderBy.Timestamp as any,
        // biome-ignore lint/suspicious/noExplicitAny:
        orderDirection: OrderDirection.Desc as any,
        // biome-ignore lint/suspicious/noExplicitAny:
        where: where as any,
      });
      return data.burns as GetBurnsQuery["burns"];
    },
  });
}

export async function getLiquidityWithdrawEvents(
  mappings: MarketDataMapping,
  account: string,
  chainId: SupportedChain,
  startTime?: number,
  endTime?: number,
) {
  const { outcomeTokenToCollateral, tokenPairToMarketMapping } = mappings;
  if (outcomeTokenToCollateral.size === 0) return [];
  const total = await fetchBurnsFromSubgraph(account, chainId, startTime, endTime);
  return total.reduce((acc, swap) => {
    const amount0 = parseUnits(swap.amount0.replace("-", ""), Number(swap.token0.decimals));
    const amount1 = parseUnits(swap.amount1.replace("-", ""), Number(swap.token1.decimals));
    const market = tokenPairToMarketMapping[getTokensPairKey(swap.token0.id, swap.token1.id)];
    if (market) {
      acc.push({
        token0: swap.token0.id,
        token1: swap.token1.id,
        amount0: amount0.toString(),
        amount1: amount1.toString(),
        token0Symbol: swap.token0.symbol,
        token1Symbol: swap.token1.symbol,
        blockNumber: Number(swap.transaction.blockNumber),
        timestamp: Number(swap.timestamp),
        marketName: market.marketName,
        marketId: market.id,
        type: "lp-burn",
        collateral: getCollateralFromDexTx(market, swap.token0.id as Address, swap.token1.id as Address),
        transactionHash: swap.transaction.id,
      });
    }
    return acc;
  }, [] as TransactionData[]);
}
