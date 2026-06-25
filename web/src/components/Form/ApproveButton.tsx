import { useApproveTokens } from "@/hooks/useApproveTokens";
import type { SupportedChain } from "@seer-pm/sdk";
import { Address } from "viem";
import Button from "./Button";

export function ApproveButton({
  tokenAddress,
  tokenName,
  spender,
  amount,
  chainId,
  className,
}: {
  tokenAddress: Address;
  tokenName: string;
  spender: Address;
  amount: bigint;
  chainId: SupportedChain;
  className?: string;
}) {
  const approveTokens = useApproveTokens();

  const approveTokensHandler = async () => {
    return await approveTokens.mutateAsync({
      tokenAddress: tokenAddress,
      spender: spender,
      amount: amount,
      chainId,
    });
  };

  return (
    <Button
      variant="primary"
      type="button"
      onClick={approveTokensHandler}
      isLoading={approveTokens.isPending}
      text={`Approve ${tokenName}`}
      className={className ?? "w-full h-auto"}
    />
  );
}
