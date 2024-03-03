import { SupportedChain } from "@/lib/chains";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { marketFactoryAddress, readMarketViewGetMarkets } from "./contracts/generated";
import { Market } from "./useMarket";

export const useMarkets = (chainId: SupportedChain) => {
  return useQuery<Market[] | undefined, Error>({
    queryKey: ["useMarkets", chainId],
    queryFn: async () => {
      const markets = await readMarketViewGetMarkets(config, {
        args: [BigInt(50), marketFactoryAddress[chainId]],
        chainId,
      });

      return markets.filter((m) => {
        const hasOpenQuestions = m.questions.find((q) => q.opening_ts !== 0);
        return hasOpenQuestions;
      });
    },
  });
};
