import { SupportedChain } from "@/lib/chains";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";

export interface PortfolioPosition {
  tokenName: string;
  tokenId: Address;
  tokenIndex: number;
  marketId: Address;
  marketName: string;
  marketStatus: string;
  tokenBalance: number;
  tokenValue?: number;
  tokenPrice?: number;
  outcome: string;
  collateralToken: Address;
  parentMarketId?: Address;
  parentMarketName?: string;
  parentOutcome?: string;
  redeemedPrice: number;
  marketFinalizeTs: number;
  outcomeImage?: string;
  isInvalidOutcome: boolean;
}

export const usePositions = (address: Address | undefined, chainId: SupportedChain) => {
  return useQuery<PortfolioPosition[] | undefined, Error>({
    enabled: !!address,
    queryKey: ["usePositions", address, chainId],
    queryFn: async () => {
      const response = await fetch(`/.netlify/functions/get-portfolio?account=${address}&chainId=${chainId}`);

      if (!response.ok) {
        throw new Error("Error fetching portfolio");
      }

      return (await response.json()) as PortfolioPosition[];
    },
  });
};
