import { useApproveTokens } from "@/hooks/useApproveTokens";
import { Address } from "viem";
import Button from "./Button";

export function ApproveButton({
  tokenAddress,
  tokenName,
  router,
  amount,
}: { tokenAddress: Address; tokenName: string; router: Address; amount: bigint }) {
  const approveTokens = useApproveTokens();

  const approveTokensHandler = async () => {
    return await approveTokens.mutateAsync({
      tokenAddress: tokenAddress,
      spender: router,
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
      className="w-full"
    />
  );
}
