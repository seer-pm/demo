import { useWrappedAddresses } from "@/hooks/useWrappedAddresses";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";

export type MarketPosition = {
  tokenId: Address;
  tokenA: Address;
  tokenB: Address;
  tokenASymbol: string;
  tokenBSymbol: string;
};

export const useMarketPositions = (
  chainId: number,
  router: Address,
  conditionId: `0x${string}`,
  outcomeSlotCount: number,
) => {
  const { data: wrappedAddresses = [] } = useWrappedAddresses(chainId, router, conditionId, outcomeSlotCount);

  return useQuery<MarketPosition[] | undefined, Error>({
    enabled: !!chainId && !!router && !!conditionId && !!outcomeSlotCount && wrappedAddresses.length > 0,
    queryKey: ["useMarketPositions", chainId, conditionId],
    queryFn: async () => {
      const collateralToken = COLLATERAL_TOKENS[chainId].primary.address;

      return await Promise.all(
        wrappedAddresses!.map(async (wrappedAddress) => {
          const [tokenA, tokenB] =
            collateralToken > wrappedAddress ? [wrappedAddress, collateralToken] : [collateralToken, wrappedAddress];

          const [tokenASymbol, tokenBSymbol] =
            tokenA === collateralToken
              ? [COLLATERAL_TOKENS[chainId].primary.symbol, "Outcome"]
              : ["Outcome", COLLATERAL_TOKENS[chainId].primary.symbol];

          return {
            tokenId: wrappedAddress,
            tokenA,
            tokenB,
            tokenASymbol,
            tokenBSymbol,
          };
        }),
      );
    },
  });
};
