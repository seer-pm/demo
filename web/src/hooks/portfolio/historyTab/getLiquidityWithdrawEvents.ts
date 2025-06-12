import {
  Burn_OrderBy,
  GetBurnsQuery,
  OrderDirection,
  getSdk as getSwaprSdk,
} from "@/hooks/queries/gql-generated-swapr";
import { getSdk as getUniswapSdk } from "@/hooks/queries/gql-generated-uniswap";
import { SupportedChain, gnosis } from "@/lib/chains";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import { Address, parseUnits } from "viem";
import { MarketDataMapping } from "../getMappings";
import { TransactionData } from "./types";

export async function fetchBurnsFromSubgraph(
  tokens: {
    tokenId: string;
    parentTokenId: `0x${string}`;
  }[],
  account: string,
  chainId: SupportedChain,
  startTime?: number,
  endTime?: number,
) {
  if (!tokens) return [];

  const graphQLClient = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);

  if (!graphQLClient) {
    throw new Error("Subgraph not available");
  }

  const graphQLSdk = chainId === gnosis.id ? getSwaprSdk : getUniswapSdk;
  const batchSize = 100;
  const maxAttemptsPerBatch = 5;
  let totalBurns: GetBurnsQuery["burns"] = [];

  // Split tokens into batches
  const tokenBatches: (typeof tokens)[] = [];
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
              or: batch.reduce(
                (acc, { tokenId, parentTokenId }) => {
                  if (parentTokenId) {
                    acc.push(
                      tokenId.toLocaleLowerCase() > parentTokenId.toLocaleLowerCase()
                        ? { token1: tokenId.toLocaleLowerCase(), token0: parentTokenId.toLocaleLowerCase() }
                        : { token0: tokenId.toLocaleLowerCase(), token1: parentTokenId.toLocaleLowerCase() },
                    );
                  } else {
                    acc.push({ token0: tokenId.toLocaleLowerCase() }, { token1: tokenId.toLocaleLowerCase() });
                  }
                  return acc;
                },
                [] as { [key: string]: string }[],
              ),
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
  const { outcomeTokenToCollateral, tokenPairToMarketMapping, marketIdToCollateral } = mappings;
  const tokens = Object.keys(outcomeTokenToCollateral).map((x) => {
    return {
      tokenId: x,
      parentTokenId: outcomeTokenToCollateral[x],
    };
  });
  const total = await fetchBurnsFromSubgraph(tokens, account, chainId, startTime, endTime);
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
        collateral: marketIdToCollateral[market.id.toLocaleLowerCase()],
        transactionHash: swap.transaction.id,
      });
    }
    return acc;
  }, [] as TransactionData[]);
}
