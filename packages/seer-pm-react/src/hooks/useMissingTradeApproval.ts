import type { SupportedChain } from "@seer-pm/sdk";
import { type Trade, getMaximumAmountIn } from "@seer-pm/sdk";
import type { Address } from "viem";
import { useMissingApprovals } from "./useMissingApprovals";

export function useMissingTradeApproval(account: Address | undefined, trade: Trade | undefined) {
  const { data, isLoading } = useMissingApprovals(
    !trade
      ? undefined
      : {
          tokensAddresses: [trade.executionPrice.baseCurrency.address as `0x${string}`],
          account,
          spender: trade.approveAddress as `0x${string}`,
          amounts: getMaximumAmountIn(trade),
          chainId: trade.chainId as SupportedChain,
        },
  );

  return { data, isLoading };
}
