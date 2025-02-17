import { ApproveButton } from "@/components/Form/ApproveButton";
import Button from "@/components/Form/Button";
import { SwitchChainButtonWrapper } from "@/components/Form/SwitchChainButtonWrapper";
import { useMissingTradeApproval } from "@/hooks/trade";
import { SupportedChain } from "@/lib/chains";
import { Trade } from "@swapr/sdk";
import { Address } from "viem";

export default function SwapButtons({
  account,
  trade,
  swapType,
  isDisabled,
  isLoading,
}: {
  account?: Address;
  trade: Trade;
  swapType: "buy" | "sell";
  isDisabled: boolean;
  isLoading: boolean;
}) {
  const { missingApprovals, isLoading: isLoadingApprovals } = useMissingTradeApproval(account!, trade);
  const isShowApproval = missingApprovals && missingApprovals.length > 0;

  return (
    <SwitchChainButtonWrapper chainId={trade.chainId as SupportedChain}>
      {!isShowApproval && (
        <Button
          variant="primary"
          type="submit"
          disabled={isDisabled}
          isLoading={isLoading || isLoadingApprovals}
          text={swapType === "buy" ? "Buy" : "Sell"}
        />
      )}
      {isShowApproval && (
        <div className="space-y-[8px]">
          {missingApprovals.map((approval) => (
            <ApproveButton
              key={approval.address}
              tokenAddress={approval.address}
              tokenName={approval.name}
              spender={approval.spender}
              amount={approval.amount}
            />
          ))}
        </div>
      )}
    </SwitchChainButtonWrapper>
  );
}
