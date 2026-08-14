import type { MarketDataMapping, SupportedChain, TransactionData } from "@seer-pm/sdk";
import { getTokensPairKey } from "@seer-pm/sdk/market-pools";
import { Burn_OrderBy, type GetBurnsQuery, OrderDirection } from "@seer-pm/sdk/subgraph/swapr";
import { type Address, parseUnits } from "viem";
import { getCollateralFromDexTx } from "../markets";
import { getDexSubgraph, mappingTokenIds } from "./dexSubgraph";
import { paginateByTimestampId } from "./subgraphTimestampIdPagination";

async function fetchBurnsFromSubgraph(
  account: string,
  chainId: SupportedChain,
  tokenIds: string[],
  startTime?: number,
  endTime?: number,
) {
  const { client, sdk } = getDexSubgraph(chainId);
  const accountLc = account.toLowerCase() as Address;

  return paginateByTimestampId<GetBurnsQuery["burns"][number]>({
    startTime,
    endTime,
    tokenIds,
    accountFilters: [{ origin: accountLc }],
    fetchPage: async (where, first) => {
      const data = await sdk(client).GetBurns({
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
  const tokenIds = mappingTokenIds(mappings);
  if (outcomeTokenToCollateral.size === 0 || tokenIds.length === 0) return [];
  const total = await fetchBurnsFromSubgraph(account, chainId, tokenIds, startTime, endTime);
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
