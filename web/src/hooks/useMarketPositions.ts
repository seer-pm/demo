import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi } from "viem";
import { Market } from "./useMarket";
import { useTokensInfo } from "./useTokenInfo";

export type Position = { tokenId: Address; balance: bigint; symbol: string; decimals: number };

export const useMarketPositions = (address: Address | undefined, market: Market) => {
  const { data: tokensInfo } = useTokensInfo(market.wrappedTokens, market.chainId);
  return useQuery<Position[] | undefined, Error>({
    enabled: !!address && tokensInfo && tokensInfo.length > 0,
    queryKey: ["useMarketPositions", address, market.id],
    queryFn: async () => {
      const balances = (await readContracts(config, {
        contracts: market.wrappedTokens!.map((wrappedAddresses) => ({
          abi: erc20Abi,
          address: wrappedAddresses,
          functionName: "balanceOf",
          args: [address],
        })),
        allowFailure: false,
      })) as bigint[];

      return tokensInfo!.map((tokenInfo, i) => ({
        tokenId: tokenInfo.address,
        balance: balances[i],
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
      }));
    },
  });
};
