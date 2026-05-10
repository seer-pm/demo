import type { Market, SupportedChain, TokenTransfer, TransactionData } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";

interface Holder {
  address: Address;
  balance: string;
}

export interface TokenTransactionsResponse {
  topHolders: { [tokenId: string]: Holder[] };
  recentTransactions: Array<TokenTransfer>;
  recentActivity: TransactionData[];
  totalTokens: number;
  totalTransactions: number;
  tokenIds: string[];
  chainId: number;
}

async function fetchTokenTransactions(market: Market, account?: Address): Promise<TokenTransactionsResponse> {
  const params = new URLSearchParams({
    chainId: market.chainId.toString(),
    marketId: market.id,
  });

  if (account) {
    params.set("account", account);
  }

  const response = await fetch(`/.netlify/functions/get-token-transactions?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch token transactions: ${response.statusText}`);
  }

  return (await response.json()) as TokenTransactionsResponse;
}

export function useMarketHolders(market: Market, account?: Address) {
  const chainId = market.chainId as SupportedChain;
  return useQuery({
    queryKey: ["marketHolders", market.id, chainId, account],
    queryFn: () => fetchTokenTransactions(market, account),
    enabled: Boolean(market.id && chainId),
    staleTime: 5 * 60 * 1000,
  });
}
