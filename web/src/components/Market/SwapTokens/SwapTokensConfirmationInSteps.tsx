import { ApproveButton } from "@/components/Form/ApproveButton";
import { useMissingApprovals } from "@/hooks/useMissingApprovals";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { Token } from "@/lib/tokens";
import { Trade } from "@swapr/sdk";
import { Address, formatUnits } from "viem";
import { useAccount } from "wagmi";
import Button from "../../Form/Button";
import ConvertToDAIButton from "./components/ConvertToDAIButton";
import ConvertToSDAIButton from "./components/ConvertToSDAIButton";

interface SwapTokensConfirmationInStepsProps {
  back: () => void;
  closeModal: () => void;
  trade: Trade;
  isLoading: boolean;
  onSubmit: () => Promise<void>;
  collateral: Token;
  originalAmount: string;
  swapType: "buy" | "sell";
  hasSell: boolean;
  setHasSell: (hasSell: boolean) => void;
}

export function SwapTokensConfirmationInSteps({
  back,
  closeModal,
  trade,
  isLoading,
  onSubmit,
  collateral,
  originalAmount,
  swapType,
  hasSell,
  setHasSell,
}: SwapTokensConfirmationInStepsProps) {
  const sDAI = COLLATERAL_TOKENS[trade.chainId as SupportedChain].primary;
  const { address: account } = useAccount();
  const { data: collateralBalance = BigInt(0) } = useTokenBalance(
    account,
    collateral.address,
    trade.chainId as SupportedChain,
  );
  const { data: sDAIBalance = BigInt(0) } = useTokenBalance(account, sDAI.address, trade.chainId as SupportedChain);
  const sDAIRequired = swapType === "buy" ? BigInt(trade.inputAmount.raw.toString()) : 0n;
  const { data: missingApprovals } = useMissingApprovals(
    [sDAI.address],
    account,
    trade.approveAddress as Address,
    [sDAIRequired],
    trade.chainId as SupportedChain,
  );
  if (swapType === "buy") {
    const hasEnoughSDAI = sDAIBalance >= sDAIRequired;
    return (
      <div>
        <div className="space-y-2">
          <p className="font-semibold">1. Convert {collateral.symbol} to sDAI</p>
          <p className="text-[12px]">sDAI Balance: {Number(formatUnits(sDAIBalance, sDAI.decimals)).toFixed(4)}</p>
          <p className="text-[12px]">
            {collateral.symbol} Balance: {Number(formatUnits(collateralBalance, collateral.decimals)).toFixed(4)}
          </p>
          <p className="text-[12px]">
            You can skip this step if you already have enough sDAI for the trade (
            {Number(formatUnits(sDAIRequired, sDAI.decimals)).toFixed(4)} sDAI).
          </p>

          <ConvertToSDAIButton
            trade={trade}
            disabled={isLoading}
            collateral={collateral}
            originalAmount={originalAmount}
          />
          <p className="font-semibold">2. Approve sDAI</p>
          {missingApprovals?.length ? (
            <div className="w-[300px]">
              <ApproveButton
                key={missingApprovals[0].address}
                tokenAddress={missingApprovals[0].address}
                tokenName={missingApprovals[0].name}
                spender={missingApprovals[0].spender}
                amount={missingApprovals[0].amount}
              />
            </div>
          ) : (
            <p>
              You have approved enough sDAI for the trade ({Number(formatUnits(sDAIRequired, sDAI.decimals)).toFixed(4)}{" "}
              sDAI).
            </p>
          )}

          <p className="font-semibold">3. Buy</p>
          <Button
            variant="primary"
            type="button"
            disabled={!!missingApprovals?.length || !hasEnoughSDAI}
            isLoading={isLoading}
            text="Buy"
            onClick={async () => {
              await onSubmit();
              closeModal();
            }}
          />
        </div>
        <div className="flex justify-center space-x-[24px] text-center mt-[32px]">
          <Button type="button" variant="secondary" text="Back" onClick={back} />
          <Button variant="primary" type="button" text="Close Modal" onClick={closeModal} />
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="space-y-2">
        <p className="font-semibold">1. Sell</p>
        {!hasSell && (
          <p className="text-[12px]">
            You will receive at least{" "}
            {Number(formatUnits(BigInt(trade.minimumAmountOut().raw.toString()), sDAI.decimals)).toFixed(4)} sDAI.
          </p>
        )}
        <Button
          variant="primary"
          type="button"
          disabled={hasSell}
          isLoading={isLoading}
          text="Sell"
          onClick={async () => {
            await onSubmit();
            setHasSell(true);
          }}
        />
        <p className="font-semibold">2. Convert sDAI to {collateral.symbol}</p>
        <p className="text-[12px]">sDAI Balance: {Number(formatUnits(sDAIBalance, sDAI.decimals)).toFixed(4)}</p>
        <p className="text-[12px]">
          {collateral.symbol} Balance: {Number(formatUnits(collateralBalance, collateral.decimals)).toFixed(4)}
        </p>
        <p className="text-[12px]">You can skip this step if you want to keep sDAI for future trades.</p>
        <ConvertToDAIButton trade={trade} collateral={collateral} disabled={isLoading || !hasSell} />
      </div>
      <div className="flex justify-center space-x-[24px] text-center mt-[32px]">
        <Button type="button" variant="secondary" text="Back" onClick={back} />
        <Button variant="primary" type="button" text="Close Modal" onClick={closeModal} />
      </div>
    </div>
  );
}
