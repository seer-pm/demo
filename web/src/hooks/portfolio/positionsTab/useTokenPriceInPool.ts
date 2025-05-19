import { SupportedChain } from "@/lib/chains";
import { useQuery } from "@tanstack/react-query";
import { gnosis, mainnet } from "viem/chains";
import { getSwaprCurrentTokensPrices, getSwaprHistoryTokensPrices } from "./getSwaprPrices";
import { getUniswapCurrentTokensPrices, getUniswapHistoryTokensPrices } from "./getUniswapPrices";

export const useHistoryTokensPrices = (
  tokens: { tokenId: string; parentTokenId?: string }[] | undefined,
  chainId: SupportedChain,
  startTime: number,
) => {
  return useQuery<{ [key: string]: number | undefined } | undefined, Error>({
    enabled: !!tokens?.length,
    queryKey: ["useHistoryTokensPrice", tokens, chainId, startTime],
    retry: false,
    queryFn: async () => {
      if (chainId === gnosis.id) {
        return await getSwaprHistoryTokensPrices(tokens, chainId, startTime);
      }
      if (chainId === mainnet.id) {
        return await getUniswapHistoryTokensPrices(tokens, chainId, startTime);
      }
    },
  });
};

export const useCurrentTokensPrices = (
  tokens: { tokenId: string; parentTokenId?: string }[] | undefined,
  chainId: SupportedChain,
) => {
  return useQuery<{ [key: string]: number | undefined } | undefined, Error>({
    enabled: !!tokens?.length,
    queryKey: ["useCurrentTokensPrice", tokens, chainId],
    retry: false,
    queryFn: async () => {
      if (chainId === gnosis.id) {
        return await getSwaprCurrentTokensPrices(tokens, chainId);
      }
      if (chainId === mainnet.id) {
        return await getUniswapCurrentTokensPrices(tokens, chainId);
      }
    },
  });
};
