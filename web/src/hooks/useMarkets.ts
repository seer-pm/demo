import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { useAccount } from "wagmi";
import { MarketViewAbi } from "../abi/MarketViewAbi";
import { DEFAULT_CHAIN, getConfigAddress } from "../lib/config";
import { config } from "../wagmi";
import { Market } from "./useMarket";

export const useMarkets = () => {
  const { chainId = DEFAULT_CHAIN } = useAccount();

  return useQuery<Market[] | undefined, Error>({
    enabled: !!chainId,
    queryKey: ["useMarkets", chainId],
    queryFn: async () => {
      const markets = await readContract(config, {
        address: getConfigAddress("MARKET_VIEW", chainId),
        abi: MarketViewAbi,
        functionName: "getMarkets",
        args: [BigInt(50), getConfigAddress("MARKET_FACTORY", chainId)],
      });

      return markets.filter((m) => m.question.opening_ts !== 0);
    },
  });
};
