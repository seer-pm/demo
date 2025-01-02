import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useSwitchChain } from "wagmi";
import Button from "./Button";

export function SwitchChainButtonWrapper({
  chainId,
  children,
}: {
  chainId: SupportedChain;
  children: React.ReactNode;
}) {
  const { isPending, switchChain } = useSwitchChain();
  const { open } = useWeb3Modal();
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
          open({ view: "Connect" });
          const interval = setInterval(() => {
            if (chainIdRef.current) {
              switchChain({ chainId });
              clearInterval(interval);
            }
          }, 2000);
          return;
        }
        switchChain({ chainId });
      }}
      isLoading={isPending}
      text={`Switch to ${SUPPORTED_CHAINS[chainId].name}`}
      className="w-full"
    />
  );
}
