import { ApproveButton } from "@/components/Form/ApproveButton";
import Button from "@/components/Form/Button";
import { SwitchChainButtonWrapper } from "@/components/Form/SwitchChainButtonWrapper";
import { tradeManagerAddress } from "@/hooks/contracts/generated-trade-manager";
import { useMissingApprovals } from "@/hooks/useMissingApprovals";
import { SupportedChain, gnosis } from "@/lib/chains";
import { Address } from "viem";

export default function SwapButtonsTradeManager({
  account,
  chainId,
  tokenIn,
  amountIn,
  swapType,
  isDisabled,
  isLoading,
}: {
  account: Address | undefined;
  chainId: SupportedChain;
  tokenIn: Address;
  amountIn: bigint;
  swapType: "buy" | "sell";
  isDisabled: boolean;
  isLoading: boolean;
}) {
  const { data: missingApprovals = [], isLoading: isLoadingApprovals } = useMissingApprovals(
    chainId === gnosis.id
      ? {
          tokensAddresses: [tokenIn],
          account,
          spender: tradeManagerAddress[chainId],
          amounts: amountIn,
          chainId: chainId,
        }
      : undefined,
  );
  return (
    <SwitchChainButtonWrapper chainId={chainId}>
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
              chainId={chainId}
            />
          ))}
        </div>
      )}
    </SwitchChainButtonWrapper>
  );
}
