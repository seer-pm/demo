import Button from "@/components/Form/Button";
import useCheckAccount from "@/hooks/useCheckAccount";
import { Orbis } from "@orbisclub/orbis-sdk";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import React from "react";
import { useAccount, useAccountEffect } from "wagmi";

export const SwitchChainButton: React.FC = () => {
  const { open } = useWeb3Modal();
  const handleSwitch = () => {
    open({ view: "Networks" });
  };
  return (
    <Button
      className="btn-purple-primary"
      isLoading={status === "pending"}
      disabled={status === "pending"}
      text="Switch to a supported network"
      onClick={handleSwitch}
    />
  );
};

type ConnectButtonProps = {
  size?: "small" | "large";
};

const ConnectButton = ({ size = "small" }: ConnectButtonProps) => {
  const { open } = useWeb3Modal();
  return <Button text={"Connect"} variant="primary" size={size} onClick={async () => open({ view: "Connect" })} />;
};

const ConnectWallet = (props: ConnectButtonProps) => {
  const { isConnected, chain } = useAccount();
  const { hasAccount } = useCheckAccount();

  useAccountEffect({
    onDisconnect() {
      const orbis = new Orbis();
      orbis.logout();
    },
  });

  if (isConnected && hasAccount) {
    if (!chain) {
      return <SwitchChainButton />;
    }

    return null;
  }
  return <ConnectButton {...props} />;
};

export default ConnectWallet;
