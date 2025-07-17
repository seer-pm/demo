import { SupportedChain } from "@/lib/chains";
import { Market } from "@/lib/market";
import { isUndefined } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { useMarkets } from "../../useMarkets";
import { getMappings } from "../getMappings";
import { getBlockTimestamp } from "../utils";
import { getLiquidityEvents } from "./getLiquidityEvents";
import { getLiquidityWithdrawEvents } from "./getLiquidityWithdrawEvents";
import { getSplitMergeRedeemEvents } from "./getSplitMergeRedeemEvents";
import { getSwapEvents } from "./getSwapEvents";
import { TransactionData } from "./types";

async function getTransactions(
  initialMarkets: Market[],
  account?: string,
  chainId?: SupportedChain,
  startTime?: number,
  endTime?: number,
) {
  if (!chainId || !account || initialMarkets.length === 0) return [];
  const markets = initialMarkets.filter((x) => x.chainId === chainId);

  const mappings = await getMappings(markets);
  const { tokenIdToTokenSymbolMapping } = mappings;
  const events = await Promise.all([
    getSwapEvents(mappings, account, chainId, startTime, endTime),
    getLiquidityEvents(mappings, account, chainId, startTime, endTime),
    getLiquidityWithdrawEvents(mappings, account, chainId, startTime, endTime),
    getSplitMergeRedeemEvents(account, chainId),
  ]);

  let data = events.flat();
  // get timestamp
  const timestamps = await Promise.all(data.map((x) => x.timestamp ?? getBlockTimestamp(x.blockNumber)));

  data = data.map((x, index) => {
    function parseSymbol(tokenAddress?: string) {
      return tokenAddress ? tokenIdToTokenSymbolMapping[tokenAddress.toLocaleLowerCase()] : undefined;
    }
    return {
      ...x,
      timestamp: timestamps[index],
      collateralSymbol: parseSymbol(x.collateral),
      token0Symbol: x.token0Symbol ?? parseSymbol(x.token0),
      token1Symbol: x.token1Symbol ?? parseSymbol(x.token1),
      tokenInSymbol: x.tokenInSymbol ?? parseSymbol(x.tokenIn),
      tokenOutSymbol: x.tokenOutSymbol ?? parseSymbol(x.tokenOut),
    };
  });

  return data.sort((a, b) => b.blockNumber - a.blockNumber);
}

export const useHistoryTransactions = (
  address: Address,
  chainId: SupportedChain,
  startTime: number | undefined,
  endTime: number | undefined,
) => {
  const { data } = useMarkets({});
  return useQuery<TransactionData[] | undefined, Error>({
    enabled: !!address && !isUndefined(data?.markets),
    queryKey: ["useHistoryTransactions", address, chainId, startTime, endTime],
    gcTime: 1000 * 60 * 60 * 24, //24 hours
    staleTime: 0,
    retry: false,
    queryFn: async () => getTransactions(data!.markets, address, chainId, startTime, endTime),
  });
};
