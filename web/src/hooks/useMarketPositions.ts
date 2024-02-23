import { MaverickPoolAbi } from "@/abi/MaverickPoolAbi";
import { useWrappedAddresses } from "@/hooks/useWrappedAddresses";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { Address } from "viem";

export type MarketPosition = {
  tokenId: Address;
  tokenA: Address;
  tokenB: Address;
  tokenABalance: bigint;
  tokenBBalance: bigint;
  tokenASymbol: string;
  tokenBSymbol: string;
};

export const useMarketPositions = (
  account: Address | undefined,
  chainId: number,
  router: Address,
  conditionId: `0x${string}`,
  outcomeSlotCount: number,
  pools: readonly Address[],
) => {
  const { data: wrappedAddresses = [] } = useWrappedAddresses(chainId, router, conditionId, outcomeSlotCount);

  return useQuery<MarketPosition[] | undefined, Error>({
    enabled:
      !!account &&
      !!chainId &&
      !!router &&
      !!conditionId &&
      !!outcomeSlotCount &&
      !!pools &&
      wrappedAddresses.length > 0,
    queryKey: ["useMarketPositions", account, chainId, conditionId],
    queryFn: async () => {
      const collateralToken = COLLATERAL_TOKENS[chainId].primary.address;

      return await Promise.all(
        wrappedAddresses!.map(async (wrappedAddress, i) => {
          const [tokenA, tokenB] =
            collateralToken > wrappedAddress ? [wrappedAddress, collateralToken] : [collateralToken, wrappedAddress];

          const [tokenASymbol, tokenBSymbol] =
            tokenA === collateralToken
              ? [COLLATERAL_TOKENS[chainId].primary.symbol, "Outcome"]
              : ["Outcome", COLLATERAL_TOKENS[chainId].primary.symbol];

          const [tokenABalance, tokenBBalance] = await fetchLPTokensBalances(pools[i]);

          return {
            tokenId: wrappedAddress,
            tokenA,
            tokenB,
            tokenABalance,
            tokenBBalance,
            tokenASymbol,
            tokenBSymbol,
          };
        }),
      );
    },
  });
};

async function fetchLPTokensBalances(pool: Address) {
  return (await readContracts(config, {
    contracts: [
      {
        abi: MaverickPoolAbi,
        address: pool,
        functionName: "binBalanceA",
      },
      {
        abi: MaverickPoolAbi,
        address: pool,
        functionName: "binBalanceB",
      },
    ],
    allowFailure: false,
  })) as bigint[];
}
