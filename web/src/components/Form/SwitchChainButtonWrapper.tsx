import { SUPPORTED_CHAINS } from "@/lib/chains";
import type { SupportedChain } from "@seer-pm/sdk";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount, useSwitchChain } from "wagmi";
import Button, { ButtonSize } from "./Button";

export function SwitchChainButtonWrapper({
  chainId,
  children,
  size,
}: {
  chainId: SupportedChain;
  children: React.ReactNode;
  size?: ButtonSize;
}) {
  const { isPending, switchChain } = useSwitchChain();
  const { chainId: connectedChainId, isConnected } = useAccount();
  const { open } = useWeb3Modal();

  // A visitor without a wallet has no network to switch, so the first step they need is connecting.
  if (!isConnected) {
    return (
      <Button
        variant="primary"
        size={size}
        type="button"
        onClick={() => open({ view: "Connect" })}
        text="Connect wallet"
        className="w-full"
      />
    );
  }
  if (chainId === connectedChainId) {
    return children;
  }
  return (
    <Button
      variant="primary"
      size={size}
      type="button"
      onClick={() => switchChain({ chainId })}
      isLoading={isPending}
      text={`Switch to ${SUPPORTED_CHAINS?.[chainId]?.name}`}
      className="w-full"
    />
  );
}
