import { useCurrentTokensPrices, useHistoryTokensPrices } from "@/hooks/portfolio/positionsTab/useTokenPriceInPool";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { isUndefined } from "@/lib/utils";
import { subDays } from "date-fns";
import { useMemo } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { usePositions } from "./usePortfolioPositions";

function useCalculatePositionsValue() {
  const { chainId = DEFAULT_CHAIN, address } = useAccount();
  const { data: positions = [], isPending } = usePositions(address as Address, chainId as SupportedChain);
  const { data: tokenIdToTokenCurrentPrice, isLoading: isLoadingCurrentPrices } = useCurrentTokensPrices(
    positions?.map((position) => {
      return {
        tokenId: position.tokenId,
        parentTokenId: position.parentTokenId,
      };
    }),
    chainId as SupportedChain,
  );

  const yesterdayInSeconds = useMemo(() => Math.floor(subDays(new Date(), 1).getTime() / 1000), []);
  const { data: tokenIdToTokenHistoryPrice, isLoading: isLoadingHistoryPrices } = useHistoryTokensPrices(
    positions?.map((position) => {
      return {
        tokenId: position.tokenId,
        parentTokenId: position.parentTokenId,
      };
    }),
    chainId as SupportedChain,
    yesterdayInSeconds,
  );

  const currentPortfolioValue = (positions ?? []).reduce((acc, curr) => {
    let tokenPrice = tokenIdToTokenCurrentPrice?.[curr.tokenId.toLocaleLowerCase()] ?? 0;
    tokenPrice = curr.redeemedPrice || tokenPrice;
    const tokenValue = tokenPrice * curr.tokenBalance;
    return acc + tokenValue;
  }, 0);
  const historyPortfolioValue = (positions ?? []).reduce((acc, curr) => {
    let tokenPrice =
      tokenIdToTokenHistoryPrice?.[curr.tokenId.toLocaleLowerCase()] ??
      tokenIdToTokenCurrentPrice?.[curr.tokenId.toLocaleLowerCase()] ??
      0;
    if (curr.marketFinalizeTs < yesterdayInSeconds) {
      tokenPrice = curr.redeemedPrice || tokenPrice;
    }
    const tokenValue = tokenPrice * curr.tokenBalance;
    return acc + tokenValue;
  }, 0);

  const delta = currentPortfolioValue - historyPortfolioValue;
  const positionsWithTokenValue = positions?.map((position) => {
    let tokenPrice = tokenIdToTokenCurrentPrice?.[position.tokenId.toLocaleLowerCase()];
    tokenPrice = position.redeemedPrice || tokenPrice;
    return {
      ...position,
      tokenPrice,
      tokenValue: !isUndefined(tokenPrice) ? tokenPrice * position.tokenBalance : undefined,
    };
  });

  return {
    isCalculating: isLoadingCurrentPrices,
    isCalculatingDelta: isLoadingHistoryPrices,
    isGettingPositions: isPending,
    delta,
    positions: positionsWithTokenValue,
    currentPortfolioValue,
    deltaPercent: Number.isNaN(delta / historyPortfolioValue) ? 0 : (delta / historyPortfolioValue) * 100,
  };
}

export default useCalculatePositionsValue;
