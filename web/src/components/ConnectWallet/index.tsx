import Button from "@/components/Form/Button";
import useCheckAccount from "@/hooks/useCheckAccount";
import { Orbis } from "@orbisclub/orbis-sdk";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import React from "react";
import { useAccount, useAccountEffect } from "wagmi";
import AccountDisplay from "./AccountDisplay";
import ChainDropdown from "./ChainDropdown";

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

type ConnectWallerProps = ConnectButtonProps & {
  isMobile?: boolean;
};

const ConnectWallet = ({ isMobile = false, ...props }: ConnectWallerProps) => {
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

    return (
      <div className="flex items-center gap-4">
        <ChainDropdown isMobile={isMobile} />
        <AccountDisplay isMobile={isMobile} />
      </div>
    );
  }
  return <ConnectButton {...props} />;
};

export default ConnectWallet;
