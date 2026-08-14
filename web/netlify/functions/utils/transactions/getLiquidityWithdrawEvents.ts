import type { MarketDataMapping, SupportedChain, TransactionData } from "@seer-pm/sdk";
import { getTokensPairKey } from "@seer-pm/sdk/market-pools";
import { Burn_OrderBy, type GetBurnsQuery } from "@seer-pm/sdk/subgraph/swapr";
import { type Address, parseUnits } from "viem";
import { getCollateralFromDexTx } from "../markets";
import { mappingTokenIds, paginateDexByTimestampId } from "./dexSubgraph";

async function fetchBurnsFromSubgraph(
  account: string,
  chainId: SupportedChain,
  tokenIds: string[],
  startTime?: number,
  endTime?: number,
) {
  const accountLc = account.toLowerCase() as Address;
  return paginateDexByTimestampId<GetBurnsQuery["burns"][number]>({
    chainId,
    startTime,
    endTime,
    tokenIds,
    accountFilters: [{ origin: accountLc }],
    orderBy: Burn_OrderBy.Timestamp,
    resultKey: "burns",
    query: (sdk, vars) => sdk.GetBurns(vars),
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
