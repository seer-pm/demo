import { SupportedChain } from "@/lib/chains";
import { isTwoStringsEqual } from "@/lib/utils";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { Address, formatUnits } from "viem";
import { gnosis } from "viem/chains";
import { multiDropAbi, multiDropAddress, readMultiDropAllTokens } from "../contracts/generated";
import { getTokensInfo } from "../portfolio/utils";
import { Market } from "../useMarket";
import { useMarkets } from "../useMarkets";

export interface AirdropTokenInfo {
  tokenName: string;
  tokenId: string;
  airdropAmount: number;
  marketAddress?: string;
  marketName?: string;
  outcome?: string;
}

export const useGetListAirdropTokens = (account: Address | undefined, chainId: SupportedChain) => {
  const { data: markets } = useMarkets({});
  const queryResult = useQuery<AirdropTokenInfo[] | undefined, Error>({
    enabled: !!account,
    queryKey: ["useGetListAirdropTokens", account],
    retry: false,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (chainId !== gnosis.id) {
        return [];
      }
      const tokenAddresses = await readMultiDropAllTokens(config, {
        args: [],
        chainId,
      });
      if (!tokenAddresses.length) {
        return [];
      }
      const [airdropAmounts, tokensInfo] = await Promise.all([
        readContracts(config, {
          contracts: tokenAddresses.map((_, index) => ({
            abi: multiDropAbi,
            address: multiDropAddress[chainId],
            functionName: "amounts",
            args: [index],
          })),
          allowFailure: false,
        }),
        getTokensInfo(tokenAddresses, account!),
      ]);
      const { names: tokenNames, decimals: tokenDecimals } = tokensInfo;
      const tokens = tokenAddresses.reduce((acumm, tokenAddress, index) => {
        acumm.push({
          tokenName: tokenNames[index],
          tokenId: tokenAddress,
          airdropAmount: Number(formatUnits(airdropAmounts[index] as unknown as bigint, Number(tokenDecimals[index]))),
        });
        return acumm;
      }, [] as AirdropTokenInfo[]);

      return tokens;
    },
  });
  const tokenToMarket = markets?.reduce(
    (acum, market) => {
      for (let i = 0; i < market.wrappedTokens.length; i++) {
        const tokenId = market.wrappedTokens[i];
        acum[tokenId.toLocaleLowerCase()] = market;
      }
      return acum;
    },
    {} as Record<string, Market>,
  );
  const tokens = queryResult.data?.map((x) => {
    const market = tokenToMarket?.[x.tokenId.toLocaleLowerCase()] as Market | undefined;
    return {
      ...x,
      marketAddress: market?.id,
      marketName: market?.marketName,
      outcome: market?.outcomes?.[market?.wrappedTokens?.findIndex((token) => isTwoStringsEqual(token, x.tokenId))],
    };
  });
  return {
    ...queryResult,
    data: tokens,
  };
};
