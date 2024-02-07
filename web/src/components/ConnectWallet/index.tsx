import Button from "@/components/Form/Button";
import { DEFAULT_CHAIN, SUPPORTED_CHAINS } from "@/lib/config";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import React from "react";
import { useAccount, useSwitchChain } from "wagmi";
import AccountDisplay from "./AccountDisplay";

export const SwitchChainButton: React.FC = () => {
  const { switchChain, status } = useSwitchChain();
  const handleSwitch = () => {
    if (!switchChain) {
      console.error("Cannot switch network. Please do it manually.");
      return;
    }
    try {
      switchChain({ chainId: DEFAULT_CHAIN });
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <Button
      isLoading={status === "pending"}
      disabled={status === "pending"}
      text={`Switch to ${SUPPORTED_CHAINS[DEFAULT_CHAIN].name}`}
      onClick={handleSwitch}
    />
  );
};

const ConnectButton = () => {
  const { open } = useWeb3Modal();
  return <Button small text={"Connect"} onClick={async () => open({ view: "Connect" })} />;
};

const ConnectWallet = () => {
  const { isConnected, chain } = useAccount();
  if (isConnected) {
    if (!chain) {
      return <SwitchChainButton />;
    }

    return <AccountDisplay />;
  }

  return <ConnectButton />;
};

export default ConnectWallet;
