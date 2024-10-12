import { usePositions } from "@/hooks/portfolio/usePortfolioPositions";
import { useCurrentTokensPrices, useHistoryTokensPrices } from "@/hooks/portfolio/useTokenPriceInPool";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { isUndefined } from "@/lib/utils";
import { subDays } from "date-fns";
import { useMemo } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";

function useCalculatePositionsValue() {
  const { chainId = DEFAULT_CHAIN, address } = useAccount();
  const { data: positions = [], isPending } = usePositions(address as Address, chainId as SupportedChain);
  const { data: tokenIdToTokenCurrentPrice, isPending: isPendingCurrentPrices } = useCurrentTokensPrices(
    positions?.map((position) => {
      return {
        tokenId: position.tokenId,
        parentTokenId: position.parentTokenId,
      };
    }),
    chainId as SupportedChain,
  );

  const yesterdayInSeconds = useMemo(() => Math.floor(subDays(new Date(), 1).getTime() / 1000), []);
  const { data: tokenIdToTokenHistoryPrice, isPending: isPendingHistoryPrices } = useHistoryTokensPrices(
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
    const tokenPrice = tokenIdToTokenCurrentPrice?.[curr.tokenId.toLocaleLowerCase()] ?? 0;
    const tokenValue = tokenPrice * curr.tokenBalance;
    return acc + tokenValue;
  }, 0);

  const historyPortfolioValue = (positions ?? []).reduce((acc, curr) => {
    const tokenPrice =
      tokenIdToTokenHistoryPrice?.[curr.tokenId.toLocaleLowerCase()] ??
      tokenIdToTokenCurrentPrice?.[curr.tokenId.toLocaleLowerCase()] ??
      0;
    const tokenValue = tokenPrice * curr.tokenBalance;
    return acc + tokenValue;
  }, 0);

  const delta = currentPortfolioValue - historyPortfolioValue;

  const positionsWithTokenValue = positions?.map((position) => {
    const tokenPrice = tokenIdToTokenCurrentPrice?.[position.tokenId.toLocaleLowerCase()];
    return {
      ...position,
      tokenPrice,
      tokenValue: !isUndefined(tokenPrice) ? tokenPrice * position.tokenBalance : undefined,
    };
  });

  return {
    isCalculating: isPendingCurrentPrices || isPendingHistoryPrices,
    isGettingPositions: isPending,
    delta,
    positions: positionsWithTokenValue,
    currentPortfolioValue,
    deltaPercent: Number.isNaN(delta / currentPortfolioValue) ? 0 : (delta / currentPortfolioValue) * 100,
  };
}

export default useCalculatePositionsValue;
