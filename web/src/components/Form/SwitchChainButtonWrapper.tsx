import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { checkWalletConnectCallback } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import Button from "./Button";

export function SwitchChainButtonWrapper({
  chainId,
  children,
}: {
  chainId: SupportedChain;
  children: React.ReactNode;
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
