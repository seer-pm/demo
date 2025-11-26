import { useApproveTokens } from "@/hooks/useApproveTokens";
import { SupportedChain } from "@/lib/chains";
import { Address } from "viem";
import Button from "./Button";

export function ApproveButton({
  tokenAddress,
  tokenName,
  spender,
  amount,
  chainId,
}: {
  tokenAddress: Address;
  tokenName: string;
  spender: Address;
  amount: bigint;
  chainId: SupportedChain;
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
      className="w-full h-auto"
    />
  );
}
