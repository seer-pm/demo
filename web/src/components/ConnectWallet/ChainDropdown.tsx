import { DEFAULT_CHAIN } from "@/lib/chains";
import { NETWORK_ICON_MAPPING } from "@/lib/config";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from "wagmi";

const ChainDropdown = () => {
  const { isConnected, chain, chainId = DEFAULT_CHAIN } = useAccount();
  const { open } = useWeb3Modal();

  const handleSwitch = () => {
    open({ view: "Networks" });
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        {NETWORK_ICON_MAPPING[chainId] && (
          <button
            type="button"
            aria-label={chain ? `Switch network (${chain.name})` : "Switch network"}
            className="flex items-center gap-2 cursor-pointer hover:opacity-85"
            onClick={handleSwitch}
          >
            <img alt="" className="w-6 h-6 rounded-full" src={NETWORK_ICON_MAPPING[chainId]}></img>
          </button>
        )}
      </div>
    );
  }
  return null;
};

export default ChainDropdown;
