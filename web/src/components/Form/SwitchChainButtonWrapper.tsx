import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { useAccount } from "wagmi";
import { useSwitchChain } from "wagmi";
import Button from "./Button";

export function SwitchChainButtonWrapper({
  chainId,
  children,
}: { chainId: SupportedChain; children: React.ReactNode }) {
  const { isPending, switchChain } = useSwitchChain();
  const { chainId: connectedChainId } = useAccount();

  if (chainId === connectedChainId) {
    return children;
  }

  return (
    <Button
      variant="primary"
      type="button"
      onClick={() => switchChain({ chainId })}
      isLoading={isPending}
      text={`Switch to ${SUPPORTED_CHAINS[chainId].name}`}
      className="w-full"
    />
  );
}
