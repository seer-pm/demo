import { SupportedChain } from "@/lib/chains";
import { fetchMarkets } from "@/lib/markets-search";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi } from "viem";

export const fetchMarketsWithPositions = async (address: Address, chainId: SupportedChain) => {
  // tokenId => marketId
  const tokenToMarket = (await fetchMarkets(chainId)).reduce(
    (acum, market) => {
      for (const tokenId of market.wrappedTokens) {
        acum[tokenId] = market.id;
      }
      return acum;
    },
    {} as Record<`0x${string}`, Address>,
  );

  // [tokenId, ..., ...]
  const allTokensIds = Object.keys(tokenToMarket) as `0x${string}`[];

  // [tokenBalance, ..., ...]
  const balances = (await readContracts(config, {
    contracts: allTokensIds.map((wrappedAddresses) => ({
      abi: erc20Abi,
      address: wrappedAddresses,
      functionName: "balanceOf",
      args: [address],
    })),
    allowFailure: false,
  })) as bigint[];

  // Set<marketWithBalance>
  const marketsWithTokens = balances.reduce((acumm, balance, index) => {
    if (balance > 0n) {
      acumm.add(tokenToMarket[allTokensIds[index]]);
    }
    return acumm;
  }, new Set<Address>());

  // [marketWithBalance, ..., ...]
  return [...marketsWithTokens];
};

export const useMarketsWithPositions = (address: Address, chainId: SupportedChain) => {
  return useQuery<Address[] | undefined, Error>({
    enabled: !!address,
    queryKey: ["useMarketsWithPositions", address, chainId],
    queryFn: async () => fetchMarketsWithPositions(address, chainId),
  });
};
