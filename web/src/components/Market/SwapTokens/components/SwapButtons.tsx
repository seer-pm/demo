import { ApproveButton } from "@/components/Form/ApproveButton";
import Button from "@/components/Form/Button";
import { SwitchChainButtonWrapper } from "@/components/Form/SwitchChainButtonWrapper";
import { UseMissingApprovalsReturn } from "@/hooks/useMissingApprovals";
import { SupportedChain } from "@/lib/chains";
import { Trade } from "@swapr/sdk";
import { Address } from "viem";

export default function SwapButtons({
  trade,
  isDisabled,
  isLoading,
  isBuyExactOutputNative,
  missingApprovals,
}: {
  account?: Address;
  trade: Trade;
  isDisabled: boolean;
  isLoading: boolean;
  isBuyExactOutputNative: boolean;
  missingApprovals: UseMissingApprovalsReturn[] | undefined;
}) {
  const isShowApproval = !isBuyExactOutputNative && missingApprovals && missingApprovals.length > 0;
  return (
    <SwitchChainButtonWrapper chainId={trade.chainId as SupportedChain}>
      {!isShowApproval && (
        <Button
          variant="primary"
          type="submit"
          disabled={isDisabled}
          isLoading={isLoading}
          text="Swap"
          className="w-full"
        />
      )}
      {isShowApproval && (
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
