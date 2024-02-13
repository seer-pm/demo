import { MarketFactoryAbi } from "@/abi/MarketFactoryAbi";
import { getConfigAddress } from "@/lib/config";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContract, readContracts } from "@wagmi/core";
import { Address, erc20Abi } from "viem";

export interface MarketFactory {
  conditionalTokens: Address;
  collateralToken: Address;
  collateralDecimals: number;
}

export const useMarketFactory = (chainId: number) => {
  return useQuery<MarketFactory | undefined, Error>({
    queryKey: ["useMarketFactory", chainId],
    queryFn: async () => {
      const marketFactoryContract = {
        abi: MarketFactoryAbi,
        address: getConfigAddress("MARKET_FACTORY", chainId),
        chainId,
      } as const;

      const result = await readContracts(config, {
        contracts: [
          {
            ...marketFactoryContract,
            functionName: "conditionalTokens",
          },
          {
            ...marketFactoryContract,
            functionName: "collateralToken",
          },
        ],
        allowFailure: false,
      });

      const collateralToken = result[1];

      const decimals = await readContract(config, {
        abi: erc20Abi,
        address: collateralToken,
        functionName: "decimals",
      });

      if (decimals) {
        return {
          conditionalTokens: result[0],
          collateralToken,
          collateralDecimals: decimals,
        };
      }

      throw new Error("useMarketFactory failed");
    },
  });
};
