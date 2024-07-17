import Button from "@/components/Form/Button";
import { DEFAULT_CHAIN } from "@/lib/chains";
import { queryClient } from "@/lib/query-client";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import React from "react";
import { useAccount, useAccountEffect } from "wagmi";
import AccountDisplay from "./AccountDisplay";

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

const ConnectButton = () => {
  const { open } = useWeb3Modal();
  return <Button text={"Connect"} variant="primary" size="small" onClick={async () => open({ view: "Connect" })} />;
};

const ConnectWallet = () => {
  useAccountEffect({
    onConnect() {
      queryClient.invalidateQueries({ queryKey: ["useMarketImages"] });
    },
    onDisconnect() {
      queryClient.invalidateQueries({ queryKey: ["useMarketImages"] });
    },
  });
  const { isConnected, chain, chainId = DEFAULT_CHAIN } = useAccount();
  if (isConnected) {
    if (!chain) {
      return <SwitchChainButton />;
    }

    return <AccountDisplay chainId={chainId} />;
  }

  return <ConnectButton />;
};

export default ConnectWallet;
