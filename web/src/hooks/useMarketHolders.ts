import { SupportedChain } from "@/lib/chains";
import { TokenTransfer } from "@/lib/tokens";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";

interface Holder {
  address: Address;
  balance: string;
}

export interface TokenTransactionsResponse {
  topHolders: { [tokenId: string]: Holder[] };
  recentTransactions: Array<TokenTransfer>;
  totalTokens: number;
  totalTransactions: number;
  tokenIds: string[];
  chainId: number;
}

async function fetchTokenTransactions(tokenIds: string[], chainId: SupportedChain): Promise<TokenTransactionsResponse> {
  const params = new URLSearchParams({
    tokenIds: tokenIds.join(","),
    chainId: chainId.toString(),
  });

  const response = await fetch(`/.netlify/functions/get-token-transactions?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch token transactions: ${response.statusText}`);
  }

  return response.json();
}

export function useMarketHolders(tokenIds: string[], chainId: SupportedChain) {
  return useQuery({
    queryKey: ["marketHolders", tokenIds, chainId],
    queryFn: () => fetchTokenTransactions(tokenIds, chainId),
    enabled: tokenIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
