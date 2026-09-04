import { useGetAirdropDataByUser } from "@/hooks/airdrop/useGetAirdropDataByUser";
import { useHistoryTransactions } from "@/hooks/portfolio/historyTab/useHistoryTransactions";
import { usePortfolioIdentity } from "@/hooks/portfolio/usePortfolioIdentity";
import { usePortfolioPositions } from "@seer-pm/react";
import type { PortfolioChainId } from "@seer-pm/sdk";
import type { Address } from "viem";

export function usePrefetchPortfolioTabs(account: Address | undefined, chainId: PortfolioChainId) {
  usePortfolioPositions(account, chainId);
  useHistoryTransactions(account);
  useGetAirdropDataByUser(account);
  usePortfolioIdentity(account);
}
