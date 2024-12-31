import useCheckAccount from "@/hooks/useCheckAccount";
import { DEFAULT_CHAIN } from "@/lib/chains";
import { NETWORK_ICON_MAPPING } from "@/lib/config";
import { DownArrow } from "@/lib/icons";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from "wagmi";

const ChainDropdown = ({ isMobile = false }: { isMobile?: boolean }) => {
  const { isConnected, chainId = DEFAULT_CHAIN } = useAccount();
  const { open } = useWeb3Modal();

  const { hasAccount } = useCheckAccount();

  const handleSwitch = () => {
    open({ view: "Networks" });
  };

  if (isConnected && hasAccount) {
    return (
      <div className="flex items-center gap-4">
        {NETWORK_ICON_MAPPING[chainId] && (
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-85" onClick={handleSwitch}>
            <img alt="network-icon" className="w-7 h-7 rounded-full" src={NETWORK_ICON_MAPPING[chainId]}></img>
            <DownArrow width={12} height={12} fill={isMobile ? "#9747FF" : "white"} />
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default ChainDropdown;
