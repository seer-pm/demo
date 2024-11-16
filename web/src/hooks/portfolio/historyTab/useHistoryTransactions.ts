import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { isTwoStringsEqual } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { Market } from "../../useMarket";
import { useMarkets } from "../../useMarkets";
import { getBlockTimestamp } from "../utils";
import { getLiquidityEvents } from "./getLiquidityEvents";
import { getLiquidityWithdrawEvents } from "./getLiquidityWithdrawEvents";
import { getMappings } from "./getMappings";
import { getSplitMergeRedeemEvents } from "./getSplitMergeRedeemEvents";
import { getSwapEvents } from "./getSwapEvents";
import { TransactionData } from "./types";

async function getTransactions(initialMarkets: Market[] | undefined, account?: string, chainId?: SupportedChain) {
  if (!chainId || !account || !initialMarkets) return [];
  const markets = initialMarkets.filter((x) => x.chainId === chainId);

  const mappings = await getMappings(markets, chainId);
  const { tokenIdToTokenSymbolMapping } = mappings;
  const events = await Promise.all([
    getSwapEvents(mappings, account, chainId),
    getLiquidityEvents(mappings, account, chainId),
    getLiquidityWithdrawEvents(mappings, account, chainId),
    getSplitMergeRedeemEvents(mappings, account, chainId),
  ]);

  let data = events.flat();
  // get timestamp
  const timestamps = await Promise.all(data.map((x) => x.timestamp ?? getBlockTimestamp(x.blockNumber)));

  data = data.map((x, index) => {
    function parseSymbol(tokenAddress?: string) {
      if (!tokenAddress) return;
      return isTwoStringsEqual(tokenAddress, COLLATERAL_TOKENS[chainId!].primary.address)
        ? "sDAI"
        : tokenIdToTokenSymbolMapping[tokenAddress.toLocaleLowerCase()];
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

export const useHistoryTransactions = (address: Address, chainId: SupportedChain) => {
  const { data: markets } = useMarkets({});
  return useQuery<TransactionData[] | undefined, Error>({
    enabled: !!address,
    queryKey: ["useHistoryTransactions", address, chainId, !!markets],
    gcTime: 1000 * 60 * 60 * 24, //24 hours
    staleTime: 0,
    retry: false,
    queryFn: async () => getTransactions(markets, address, chainId),
  });
};
