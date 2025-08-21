import { SupportedChain } from "@/lib/chains";
import { useQuery } from "@tanstack/react-query";
import { gnosis, mainnet, optimism } from "viem/chains";
import { getSwaprCurrentTokensPrices, getSwaprHistoryTokensPrices } from "./getSwaprPrices";
import { getUniswapCurrentTokensPrices, getUniswapHistoryTokensPrices } from "./getUniswapPrices";
import { PortfolioPosition } from "./usePortfolioPositions";

export const useHistoryTokensPrices = (positions: PortfolioPosition[], chainId: SupportedChain, startTime: number) => {
  return useQuery<{ [key: string]: number | undefined } | undefined, Error>({
    enabled: positions.length > 0,
    queryKey: ["useHistoryTokensPrice", positions, chainId, startTime],
    retry: false,
    queryFn: async () => {
      if (chainId === gnosis.id) {
        return await getSwaprHistoryTokensPrices(positions, chainId, startTime);
      }
      if (chainId === mainnet.id || chainId === optimism.id) {
        return await getUniswapHistoryTokensPrices(positions, chainId, startTime);
      }
    },
  });
};

export const useCurrentTokensPrices = (positions: PortfolioPosition[], chainId: SupportedChain) => {
  return useQuery<{ [key: string]: number | undefined } | undefined, Error>({
    enabled: positions.length > 0,
    queryKey: ["useCurrentTokensPrice", positions, chainId],
    retry: false,
    queryFn: async () => {
      if (chainId === gnosis.id) {
        return await getSwaprCurrentTokensPrices(positions, chainId);
      }
      if (chainId === mainnet.id || chainId === optimism.id) {
        return await getUniswapCurrentTokensPrices(positions, chainId);
      }
    },
  });
};
