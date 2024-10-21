import { ApproveButton } from "@/components/Form/ApproveButton";
import Button from "@/components/Form/Button";
import { S_DAI_ADAPTER, redeemFromSDAI, redeemFromSDAIToNative, useConvertToAssets } from "@/hooks/trade/handleSDAI";
import { useMissingApprovals } from "@/hooks/useMissingApprovals";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { Token } from "@/lib/tokens";
import { NATIVE_TOKEN, isTwoStringsEqual, isUndefined } from "@/lib/utils";
import { Trade } from "@swapr/sdk";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";

export default function ConvertToDAIButton({
  trade,
  collateral,
  disabled,
}: {
  trade: Trade;
  collateral: Token;
  disabled: boolean;
}) {
  const sDAI = COLLATERAL_TOKENS[trade.chainId as SupportedChain].primary;
  const { address: account } = useAccount();
  const { data: sDAIBalance = BigInt(0) } = useTokenBalance(account, sDAI.address, trade.chainId as SupportedChain);
  const sDAIOutput = BigInt(trade.minimumAmountOut().raw.toString());
  const [convertAmount, setConvertAmount] = useState(Number(formatUnits(sDAIOutput, sDAI.decimals)));
  const [error, setError] = useState("");
  const convertAmountBigInt = parseUnits(convertAmount.toString(), collateral.decimals);
  const { data: assets } = useConvertToAssets(convertAmountBigInt, trade.chainId);
  const { mutate: mutateRedeemFromSDAI, isPending } = useMutation({
    mutationFn: redeemFromSDAI,
    onSuccess: () => {
      setConvertAmount(0);
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
    },
  });

  const { mutate: mutateRedeemFromSDAIToNative, isPending: isPendingToNative } = useMutation({
    mutationFn: redeemFromSDAIToNative,
    onSuccess: () => {
      setConvertAmount(0);
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
    },
  });
  const { data: missingApprovals, isPending: isPendingApproval } = useMissingApprovals(
    [sDAI.address],
    account,
    S_DAI_ADAPTER,
    [convertAmountBigInt],
    trade.chainId as SupportedChain,
  );
  const isShowMissingApprovals = missingApprovals?.length && isTwoStringsEqual(collateral.address, NATIVE_TOKEN);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p>Convert</p>
        <div>
          <input
            type="number"
            className="input input-bordered bg-white focus:outline-purple-primary w-[180px]"
            value={convertAmount}
            disabled={disabled || isPending}
            onChange={(e) => {
              const value = (e.target as HTMLInputElement).value;
              setError("");
              if (parseUnits(value, sDAI.decimals) > sDAIBalance) {
                setError("Input value exceeds balance.");
              }
              setConvertAmount(Number(value));
            }}
          />
          {error && <p className="text-[12px] text-error-primary mt-1">{error}</p>}
        </div>
        <p>
          {sDAI.symbol} to {!isUndefined(assets) ? Number(formatUnits(assets, collateral.decimals)).toFixed(4) : "-"}{" "}
          {collateral.symbol}
        </p>
      </div>
      {isShowMissingApprovals ? (
        <div className="space-y-2">
          {missingApprovals.map((approval) => (
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
        <Button
          variant="primary"
          type="button"
          disabled={disabled || !!error || isPendingApproval}
          text="Convert"
          isLoading={isPending || isPendingToNative}
          onClick={() =>
            isTwoStringsEqual(collateral.address, NATIVE_TOKEN)
              ? mutateRedeemFromSDAIToNative({ amount: sDAIOutput, chainId: trade.chainId, owner: account! })
              : mutateRedeemFromSDAI({ amount: sDAIOutput, chainId: trade.chainId, owner: account! })
          }
        />
      )}
    </div>
  );
}
