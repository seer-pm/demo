import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { checkWalletConnectCallback } from "@/lib/wallet";
import { useEffect, useRef } from "react";
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
  const { chainId: connectedChainId } = useAccount();

  const chainIdRef = useRef(connectedChainId);
  useEffect(() => {
    chainIdRef.current = connectedChainId;
  }, [connectedChainId]);
  if (chainId === connectedChainId) {
    return children;
  }
  return (
    <Button
      variant="primary"
      size={size}
      type="button"
      onClick={() => {
        if (!connectedChainId) {
          checkWalletConnectCallback(() => switchChain({ chainId }), 2000);
          return;
        }
        switchChain({ chainId });
      }}
      isLoading={isPending}
      text={`Switch to ${SUPPORTED_CHAINS?.[chainId]?.name}`}
      className="w-full"
    />
  );
}
