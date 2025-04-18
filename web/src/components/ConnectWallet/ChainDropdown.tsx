import { DEFAULT_CHAIN } from "@/lib/chains";
import { NETWORK_ICON_MAPPING } from "@/lib/config";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from "wagmi";

const ChainDropdown = () => {
  const { isConnected, chainId = DEFAULT_CHAIN } = useAccount();
  const { open } = useWeb3Modal();

  const handleSwitch = () => {
    open({ view: "Networks" });
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        {NETWORK_ICON_MAPPING[chainId] && (
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-85" onClick={handleSwitch}>
            <img alt="network-icon" className="w-6 h-6 rounded-full" src={NETWORK_ICON_MAPPING[chainId]}></img>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default ChainDropdown;
