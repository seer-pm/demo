import { ApproveButton } from "@/components/Form/ApproveButton";
import Button from "@/components/Form/Button";
import { SwitchChainButtonWrapper } from "@/components/Form/SwitchChainButtonWrapper";
import { tradeManagerAddress } from "@/hooks/contracts/generated";
import { useMissingApprovals } from "@/hooks/useMissingApprovals";
import { SupportedChain } from "@/lib/chains";
import { Address } from "viem";
import { gnosis } from "viem/chains";

export default function SwapButtonsTradeManager({
  account,
  tokenIn,
  amountIn,
  swapType,
  isDisabled,
  isLoading,
}: {
  account: Address | undefined;
  tokenIn: Address;
  amountIn: bigint;
  swapType: "buy" | "sell";
  isDisabled: boolean;
  isLoading: boolean;
}) {
  const { data: missingApprovals = [], isLoading: isLoadingApprovals } = useMissingApprovals(
    [tokenIn],
    account,
    tradeManagerAddress[gnosis.id],
    amountIn,
    gnosis.id,
  );
  return (
    <SwitchChainButtonWrapper chainId={gnosis.id as SupportedChain}>
      {!missingApprovals.length && (
        <Button
          variant="primary"
          type="submit"
          disabled={isDisabled}
          isLoading={isLoading || isLoadingApprovals}
          text={swapType === "buy" ? "Buy" : "Sell"}
        />
      )}
      {missingApprovals.length > 0 && (
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
