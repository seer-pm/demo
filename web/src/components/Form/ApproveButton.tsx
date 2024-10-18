import { useApproveTokens } from "@/hooks/useApproveTokens";
import { Address } from "viem";
import Button from "./Button";

export function ApproveButton({
  tokenAddress,
  tokenName,
  spender,
  amount,
}: {
  tokenAddress: Address;
  tokenName: string;
  spender: Address;
  amount: bigint;
}) {
  const approveTokens = useApproveTokens();

  const approveTokensHandler = async () => {
    return await approveTokens.mutateAsync({
      tokenAddress: tokenAddress,
      spender: spender,
      amount: amount,
    });
  };

  return (
    <Button
      variant="primary"
      type="button"
      onClick={approveTokensHandler}
      isLoading={approveTokens.isPending}
      text={`Approve ${tokenName}`}
      className="w-full h-auto"
    />
  );
}
