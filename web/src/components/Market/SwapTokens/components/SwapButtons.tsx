import { ApproveButton } from "@/components/Form/ApproveButton";
import Button from "@/components/Form/Button";
import { SwitchChainButtonWrapper } from "@/components/Form/SwitchChainButtonWrapper";
import type { UseMissingApprovalsReturn } from "@seer-pm/react";
import type { AmmTrade, CoWTrade, SupportedChain } from "@seer-pm/sdk";
import { Address } from "viem";

export default function SwapButtons({
  trade,
  isDisabled,
  isLoading,
  missingApprovals,
  text,
}: {
  account?: Address;
  trade: CoWTrade | AmmTrade;
  isDisabled: boolean;
  isLoading: boolean;
  missingApprovals: UseMissingApprovalsReturn[] | undefined;
  text?: string;
}) {
  const isShowApproval = Boolean(missingApprovals && missingApprovals.length > 0);
  return (
    <SwitchChainButtonWrapper chainId={trade.chainId as SupportedChain}>
      {!isShowApproval && (
        <Button
          variant="primary"
          type="submit"
          disabled={isDisabled}
          isLoading={isLoading}
          text={text ?? "Swap"}
          className="w-full"
        />
      )}
      {isShowApproval && missingApprovals && (
        <div className="space-y-[8px] w-full">
          {missingApprovals.map((approval) => (
            <ApproveButton
              key={approval.address}
              tokenAddress={approval.address}
              tokenName={approval.name}
              spender={approval.spender}
              amount={approval.amount}
              chainId={trade.chainId as SupportedChain}
            />
          ))}
        </div>
      )}
    </SwitchChainButtonWrapper>
  );
}
