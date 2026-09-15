import type { AmmTrade, CompleteSetLeg, Psm3Leg, SupportedChain } from "@seer-pm/sdk";
import {
  getCompleteSetApprovalTokens,
  getMaximumAmountIn,
  getPsm3CompositeApprovalTokens,
  getTradeApproveTokenAddress,
} from "@seer-pm/sdk";
import type { Address } from "viem";
import { type ApprovalRequest, useMissingApprovals, useMissingApprovalsList } from "./useMissingApprovals";

function toApprovalRequests(approval: { tokensAddresses: Address[]; spenders: Address[]; amounts: bigint[] }) {
  return approval.tokensAddresses.map(
    (tokenAddress, i): ApprovalRequest => ({
      tokenAddress,
      spender: approval.spenders[i],
      amount: approval.amounts[i],
    }),
  );
}

export function useMissingTradeApproval(
  account: Address | undefined,
  trade: AmmTrade | undefined,
  psm3Leg?: Psm3Leg,
  completeSetLeg?: CompleteSetLeg,
) {
  const completeSetApproval =
    completeSetLeg && trade && account
      ? getCompleteSetApprovalTokens({
          trade,
          account,
          isTradingCredits: false,
          completeSetLeg,
        })
      : null;

  const psm3Approval =
    !completeSetApproval?.tokensAddresses.length && trade && psm3Leg && account
      ? getPsm3CompositeApprovalTokens({
          trade,
          account,
          isTradingCredits: false,
          psm3Leg,
        })
      : null;

  const compositeApproval =
    completeSetApproval && completeSetApproval.tokensAddresses.length > 0
      ? completeSetApproval
      : psm3Approval && psm3Approval.tokensAddresses.length > 0
        ? psm3Approval
        : null;

  const compositeApprovals = useMissingApprovalsList(
    compositeApproval ? toApprovalRequests(compositeApproval) : [],
    account,
    trade?.chainId,
  );

  const standard = useMissingApprovals(
    !trade || compositeApproval?.tokensAddresses.length
      ? undefined
      : {
          tokensAddresses: [getTradeApproveTokenAddress(trade)],
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
