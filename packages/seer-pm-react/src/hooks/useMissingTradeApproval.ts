import type { CompleteSetLeg, Psm3Leg, SupportedChain } from "@seer-pm/sdk";
import { getCompleteSetApprovalTokens, getMaximumAmountIn, getPsm3CompositeApprovalTokens } from "@seer-pm/sdk";
import { CoWTrade, SwaprV3Trade, type Trade, UniswapTrade } from "@swapr/sdk";
import type { Address } from "viem";
import { useMissingApprovals } from "./useMissingApprovals";

type MissingApprovalsResult = ReturnType<typeof useMissingApprovals>;

function mergeApprovalResults(results: MissingApprovalsResult[]): MissingApprovalsResult {
  const base = results[0];
  return {
    ...base,
    data: results.flatMap((result) => result.data ?? []),
    error: results.find((result) => result.error)?.error ?? null,
    isError: results.some((result) => result.isError),
    isLoading: results.some((result) => result.isLoading),
    isFetching: results.some((result) => result.isFetching),
    isSuccess: results.every((result) => result.isSuccess),
    status: results.some((result) => result.isError)
      ? "error"
      : results.every((result) => result.isSuccess)
        ? "success"
        : "pending",
  } as MissingApprovalsResult;
}

function useCompositeMissingApprovals(
  account: Address | undefined,
  tokensAddresses: Address[],
  spenders: Address[],
  amounts: bigint[],
  chainId: number | undefined,
) {
  const slot0 = useMissingApprovals(
    tokensAddresses[0] && spenders[0] && chainId
      ? {
          tokensAddresses: [tokensAddresses[0]],
          account,
          spender: spenders[0],
          amounts: amounts[0],
          chainId: chainId as SupportedChain,
        }
      : undefined,
  );
  const slot1 = useMissingApprovals(
    tokensAddresses[1] && spenders[1] && chainId
      ? {
          tokensAddresses: [tokensAddresses[1]],
          account,
          spender: spenders[1],
          amounts: amounts[1],
          chainId: chainId as SupportedChain,
        }
      : undefined,
  );
  const slot2 = useMissingApprovals(
    tokensAddresses[2] && spenders[2] && chainId
      ? {
          tokensAddresses: [tokensAddresses[2]],
          account,
          spender: spenders[2],
          amounts: amounts[2],
          chainId: chainId as SupportedChain,
        }
      : undefined,
  );
  const slot3 = useMissingApprovals(
    tokensAddresses[3] && spenders[3] && chainId
      ? {
          tokensAddresses: [tokensAddresses[3]],
          account,
          spender: spenders[3],
          amounts: amounts[3],
          chainId: chainId as SupportedChain,
        }
      : undefined,
  );

  return mergeApprovalResults([slot0, slot1, slot2, slot3]);
}

export function useMissingTradeApproval(
  account: Address | undefined,
  trade: Trade | undefined,
  psm3Leg?: Psm3Leg,
  completeSetLeg?: CompleteSetLeg,
) {
  const completeSetApproval =
    completeSetLeg && trade && account && !(trade instanceof CoWTrade)
      ? getCompleteSetApprovalTokens({
          trade: trade as SwaprV3Trade | UniswapTrade,
          account,
          isBuyExactOutputNative: false,
          isSellToNative: false,
          isSeerCredits: false,
          completeSetLeg,
        })
      : null;

  const psm3Approval =
    !completeSetApproval?.tokensAddresses.length && trade && psm3Leg && account && trade instanceof UniswapTrade
      ? getPsm3CompositeApprovalTokens({
          trade,
          account,
          isBuyExactOutputNative: false,
          isSellToNative: false,
          isSeerCredits: false,
          psm3Leg,
        })
      : null;

  const compositeApproval =
    completeSetApproval && completeSetApproval.tokensAddresses.length > 0
      ? completeSetApproval
      : psm3Approval && psm3Approval.tokensAddresses.length > 0
        ? psm3Approval
        : null;

  const compositeApprovals = useCompositeMissingApprovals(
    account,
    compositeApproval?.tokensAddresses ?? [],
    compositeApproval?.spenders ?? [],
    compositeApproval?.amounts ?? [],
    trade?.chainId,
  );

  const standard = useMissingApprovals(
    !trade || compositeApproval?.tokensAddresses.length
      ? undefined
      : {
          tokensAddresses: [trade.executionPrice.baseCurrency.address as `0x${string}`],
          account,
          spender: trade.approveAddress as `0x${string}`,
          amounts: getMaximumAmountIn(trade),
          chainId: trade.chainId as SupportedChain,
        },
  );

  if (compositeApproval && compositeApproval.tokensAddresses.length > 0) {
    return compositeApprovals;
  }

  return standard;
}
