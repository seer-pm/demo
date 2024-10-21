import { ApproveButton } from "@/components/Form/ApproveButton";
import Button from "@/components/Form/Button";
import { depositFromNativeToSDAI, depositToSDAI, useConvertToShares } from "@/hooks/trade/handleSDAI";
import { useMissingApprovals } from "@/hooks/useMissingApprovals";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { Token } from "@/lib/tokens";
import { NATIVE_TOKEN, isTwoStringsEqual } from "@/lib/utils";
import { Trade } from "@swapr/sdk";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";

export default function ConvertToSDAIButton({
  trade,
  collateral,
  originalAmount,
  disabled,
}: {
  trade: Trade;
  collateral: Token;
  originalAmount: string;
  disabled: boolean;
}) {
  const [depositAmount, setDepositAmount] = useState(Number(originalAmount));
  const depositAmountBigInt = parseUnits(depositAmount.toString(), collateral.decimals);
  const [error, setError] = useState("");
  const { data: shares } = useConvertToShares(depositAmountBigInt, trade.chainId);
  const sDAI = COLLATERAL_TOKENS[trade.chainId as SupportedChain].primary;
  const { address: account } = useAccount();
  const { data: collateralBalance = BigInt(0) } = useTokenBalance(
    account,
    collateral.address,
    trade.chainId as SupportedChain,
  );
  const { data: missingApprovalsCollateral, isPending: isPendingApproval } = useMissingApprovals(
    [collateral.address],
    account,
    sDAI.address,
    [depositAmountBigInt],
    trade.chainId as SupportedChain,
  );
  const { mutate: mutateDepositFromNativeToSDAI, isPending: isPendingNative } = useMutation({
    mutationFn: depositFromNativeToSDAI,
    onSuccess: () => {
      setDepositAmount(0);
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
    },
  });

  const { mutate: mutateDepositToSDAI, isPending } = useMutation({
    mutationFn: depositToSDAI,
    onSuccess: () => {
      setDepositAmount(0);
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
    },
  });
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p>Convert</p>
        <div>
          <input
            type="number"
            className="input input-bordered bg-white focus:outline-purple-primary w-[180px]"
            value={depositAmount}
            disabled={disabled || isPending}
            onChange={(e) => {
              const value = (e.target as HTMLInputElement).value;
              setError("");
              if (parseUnits(value, collateral.decimals) > collateralBalance) {
                setError("Input value exceeds balance.");
              }
              setDepositAmount(Number((e.target as HTMLInputElement).value));
            }}
          />
        </div>
        <p>
          {collateral.symbol} to {shares ? Number(formatUnits(shares, sDAI.decimals)).toFixed(4) : "-"} sDAI
        </p>
      </div>
      {missingApprovalsCollateral?.length ? (
        <div className="space-y-2">
          {missingApprovalsCollateral.map((approval) => (
            <div key={approval.address} className="w-[300px]">
              <ApproveButton
                tokenAddress={approval.address}
                tokenName={approval.name}
                spender={approval.spender}
                amount={approval.amount}
              />
            </div>
          ))}
        </div>
      ) : (
        <div>
          <Button
            variant="primary"
            type="button"
            disabled={disabled || !!error || isPendingApproval}
            text="Convert"
            isLoading={isPending || isPendingNative}
            onClick={() =>
              isTwoStringsEqual(collateral.address, NATIVE_TOKEN)
                ? mutateDepositFromNativeToSDAI({
                    amount: depositAmountBigInt,
                    chainId: trade.chainId,
                    owner: account!,
                  })
                : mutateDepositToSDAI({ amount: depositAmountBigInt, chainId: trade.chainId, owner: account! })
            }
          />
        </div>
      )}
    </div>
  );
}
