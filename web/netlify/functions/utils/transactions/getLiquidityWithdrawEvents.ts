import { MarketDataMapping } from "@/hooks/portfolio/getMappings";
import { TransactionData } from "@/hooks/portfolio/historyTab/types";
import {
  Burn_OrderBy,
  GetBurnsQuery,
  OrderDirection,
  getSdk as getSwaprSdk,
} from "@/hooks/queries/gql-generated-swapr";
import { getSdk as getUniswapSdk } from "@/hooks/queries/gql-generated-uniswap";
import { SupportedChain, gnosis } from "@/lib/chains";
import { Token0Token1, getCollateralFromDexTx, getToken0Token1 } from "@/lib/market";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import { Address, parseUnits } from "viem";

async function fetchBurnsFromSubgraph(
  outcomeTokenToCollateral: MarketDataMapping["outcomeTokenToCollateral"],
  account: string,
  chainId: SupportedChain,
  startTime?: number,
  endTime?: number,
) {
  if (outcomeTokenToCollateral.size === 0) return [];

  const graphQLClient = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);

  if (!graphQLClient) {
    throw new Error("Subgraph not available");
  }

  const graphQLSdk = chainId === gnosis.id ? getSwaprSdk : getUniswapSdk;
  const batchSize = 100;
  const maxAttemptsPerBatch = 5;
  let totalBurns: GetBurnsQuery["burns"] = [];

  // Split tokens into batches
  const tokenBatches: Array<Token0Token1>[] = [];
  const tokens = Array.from(outcomeTokenToCollateral, ([tokenId, collateralToken]) =>
    getToken0Token1(tokenId, collateralToken),
  );
  for (let i = 0; i < tokens.length; i += batchSize) {
    tokenBatches.push(tokens.slice(i, i + batchSize));
  }

  // Process each batch
  for (const batch of tokenBatches) {
    let attempt = 1;
    let timestamp: string | undefined = endTime?.toString();

    while (attempt < maxAttemptsPerBatch) {
      const data = await graphQLSdk(graphQLClient).GetBurns({
        first: 1000,
        // biome-ignore lint/suspicious/noExplicitAny:
        orderBy: Burn_OrderBy.Timestamp as any,
        // biome-ignore lint/suspicious/noExplicitAny:
        orderDirection: OrderDirection.Desc as any,
        where: {
          and: [
            {
              or: batch,
            },
            {
              origin: account.toLocaleLowerCase() as Address,
              timestamp_lt: timestamp,
              ...(startTime && { timestamp_gte: startTime.toString() }),
            },
          ],
        },
      });

      const burns = data.burns as GetBurnsQuery["burns"];
      totalBurns = totalBurns.concat(burns);

      // Stop if no more burns or same timestamp (no progress)
      if (burns.length === 0 || burns[burns.length - 1]?.timestamp === timestamp) {
        break;
      }

      // Update timestamp for next page
      timestamp = burns[burns.length - 1]?.timestamp;

      // Stop if less than the page size (no more data)
      if (burns.length < 1000) {
        break;
      }

      attempt++;
    }
  }

  return totalBurns;
}

export async function getLiquidityWithdrawEvents(
  mappings: MarketDataMapping,
  account: string,
  chainId: SupportedChain,
  startTime?: number,
  endTime?: number,
) {
  const { outcomeTokenToCollateral, tokenPairToMarketMapping } = mappings;
  const total = await fetchBurnsFromSubgraph(outcomeTokenToCollateral, account, chainId, startTime, endTime);
  return total.reduce((acc, swap) => {
    const amount0 = parseUnits(swap.amount0.replace("-", ""), Number(swap.token0.decimals));
    const amount1 = parseUnits(swap.amount1.replace("-", ""), Number(swap.token1.decimals));
    const market =
      tokenPairToMarketMapping[`${swap.token0.id.toLocaleLowerCase()}-${swap.token1.id.toLocaleLowerCase()}`];
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
