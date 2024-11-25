import Button from "@/components/Form/Button";
import { DEFAULT_CHAIN } from "@/lib/chains";
import { NETWORK_ICON_MAPPING } from "@/lib/config";
import { DownArrow } from "@/lib/icons";
import { Orbis } from "@orbisclub/orbis-sdk";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import React, { useEffect, useState } from "react";
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

const ConnectWallet = ({ isMobile = false }: { isMobile?: boolean }) => {
  const { isConnected, chain, chainId = DEFAULT_CHAIN } = useAccount();
  const { open } = useWeb3Modal();

  const [hasAccount, sethasAccount] = useState(false);

  useEffect(() => {
    const checkAccount = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        sethasAccount(accounts.length > 0);
      }
    };

    checkAccount();
    window.ethereum?.on("accountsChanged", checkAccount);

    return () => {
      window.ethereum?.removeListener("accountsChanged", checkAccount);
    };
  }, []);

  const handleSwitch = () => {
    open({ view: "Networks" });
  };
  useAccountEffect({
    onConnect() {
      const orbis = new Orbis();
      if (!localStorage.getItem("ceramic-session")) {
        orbis.connect_v2({});
      }
    },
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
        {NETWORK_ICON_MAPPING[chainId] && (
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-85" onClick={handleSwitch}>
            <img alt="network-icon" className="w-7 h-7 rounded-full" src={NETWORK_ICON_MAPPING[chainId]}></img>
            <DownArrow width={12} height={12} fill={isMobile ? "#9747FF" : "white"} />
          </div>
        )}
        <AccountDisplay chainId={chainId} isMobile={isMobile} />
      </div>
    );
  }
  return <ConnectButton />;
};

export default ConnectWallet;
