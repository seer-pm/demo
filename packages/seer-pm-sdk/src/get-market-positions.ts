import type { Address, Client } from "viem";
import { erc20Abi } from "viem";
import { multicall } from "viem/actions";
import type { SupportedChain } from "./chains";
import { getTokensInfo } from "./token-info";

export interface MarketPosition {
  tokenId: Address;
  balance: bigint;
  symbol: string;
  decimals: number;
}

interface GetMarketPositionsParams {
  client: Client;
  address: Address;
  wrappedTokens: Address[];
  chainId: SupportedChain;
}

export const getMarketPositions = async ({
  client,
  address,
  wrappedTokens,
  chainId,
}: GetMarketPositionsParams): Promise<MarketPosition[]> => {
  const tokensInfo = await getTokensInfo(wrappedTokens, chainId, client);

  const balances = (await multicall(client, {
    contracts: wrappedTokens.map((wrappedAddress) => ({
      abi: erc20Abi,
      address: wrappedAddress,
      functionName: "balanceOf",
      args: [address],
    })),
    allowFailure: false,
  })) as bigint[];

  return tokensInfo.map((tokenInfo, i) => ({
    tokenId: tokenInfo.address,
    balance: balances[i],
    symbol: tokenInfo.symbol,
    decimals: tokenInfo.decimals,
  }));
};
