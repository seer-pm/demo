import { ApproveButton } from "@/components/Form/ApproveButton";
import Button from "@/components/Form/Button";
import { SwitchChainButtonWrapper } from "@/components/Form/SwitchChainButtonWrapper";
import { useMissingApprovals } from "@/hooks/useMissingApprovals";
import { SupportedChain } from "@/lib/chains";
import { CoWTrade } from "@swapr/sdk";
import { Address, parseUnits } from "viem";

export default function SwapButtonsLimitOrder({
  account,
  amount,
  sellToken,
  swapType,
  isDisabled,
  isLoading,
  chainId,
}: {
  account: Address | undefined;
  amount: string;
  sellToken: string;
  swapType: "buy" | "sell";
  isDisabled: boolean;
  isLoading: boolean;
  chainId: SupportedChain;
}) {
  const { data: missingApprovals, isLoading: isLoadingApprovals } = useMissingApprovals({
    tokensAddresses: [sellToken as `0x${string}`],
    account,
    spender: CoWTrade.getVaultRelayerAddress(chainId),
    amounts: parseUnits(amount, 18),
    chainId,
  });
  console.log(account);
  const isShowApproval = missingApprovals && missingApprovals.length > 0;

  return (
    <SwitchChainButtonWrapper chainId={chainId}>
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
