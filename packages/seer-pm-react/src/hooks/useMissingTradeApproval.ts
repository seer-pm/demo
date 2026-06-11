import type { Psm3Leg, SupportedChain } from "@seer-pm/sdk";
import { type Trade, getMaximumAmountIn, getPsm3CompositeApprovalTokens } from "@seer-pm/sdk";
import { UniswapTrade } from "@swapr/sdk";
import type { Address } from "viem";
import { useMissingApprovals } from "./useMissingApprovals";

export function useMissingTradeApproval(account: Address | undefined, trade: Trade | undefined, psm3Leg?: Psm3Leg) {
  const compositeApproval =
    trade && psm3Leg && account && trade instanceof UniswapTrade
      ? getPsm3CompositeApprovalTokens({
          trade,
          account,
          isBuyExactOutputNative: false,
          isSellToNative: false,
          isSeerCredits: false,
          psm3Leg,
        })
      : null;

  const useStandardApproval = !compositeApproval || compositeApproval.tokensAddresses.length === 0;

  const standard = useMissingApprovals(
    !trade || !useStandardApproval
      ? undefined
      : {
          tokensAddresses: [trade.executionPrice.baseCurrency.address as `0x${string}`],
          account,
          spender: trade.approveAddress as `0x${string}`,
          amounts: getMaximumAmountIn(trade),
          chainId: trade.chainId as SupportedChain,
        },
  );

  const composite0 = useMissingApprovals(
    compositeApproval?.tokensAddresses[0]
      ? {
          tokensAddresses: [compositeApproval.tokensAddresses[0]],
          account,
          spender: compositeApproval.spenders[0],
          amounts: compositeApproval.amounts[0],
          chainId: trade!.chainId as SupportedChain,
        }
      : undefined,
  );

  const composite1 = useMissingApprovals(
    compositeApproval?.tokensAddresses[1]
      ? {
          tokensAddresses: [compositeApproval.tokensAddresses[1]],
          account,
          spender: compositeApproval.spenders[1],
          amounts: compositeApproval.amounts[1],
          chainId: trade!.chainId as SupportedChain,
        }
      : undefined,
  );

  if (compositeApproval && compositeApproval.tokensAddresses.length > 0) {
    const isError = composite0.isError || composite1.isError;
    const isLoading = composite0.isLoading || composite1.isLoading;
    const isFetching = composite0.isFetching || composite1.isFetching;
    const isSuccess = composite0.isSuccess && composite1.isSuccess;

    return {
      ...composite0,
      data: [...(composite0.data ?? []), ...(composite1.data ?? [])],
      error: composite0.error ?? composite1.error,
      isError,
      isLoading,
      isFetching,
      isSuccess,
      status: isError ? "error" : isSuccess ? "success" : "pending",
    };
  }

  return standard;
}
