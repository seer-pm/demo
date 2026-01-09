import { SupportedChain, gnosis } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { CloseIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { displayBalance } from "@/lib/utils";
import { base, mainnet, optimism, sepolia } from "viem/chains";

function DepositGuide({
  closeModal,
  chainId,
  balance,
}: {
  closeModal: () => void;
  chainId: SupportedChain;
  balance: bigint;
}) {
  const buttonByChain = {
    [gnosis.id]: (
      <a target="_blank" rel="noopener noreferrer" href={paths.xDAIBridge()} className="btn btn-primary">
        Bridge xDAI
      </a>
    ),
    [mainnet.id]: (
      <a target="_blank" rel="noopener noreferrer" href={paths.swapETHToDai()} className="btn btn-primary">
        Swap from ETH
      </a>
    ),
    [sepolia.id]: null,
    [optimism.id]: null,
    [base.id]: null,
  };
  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        className="absolute right-[20px] top-[20px] hover:text-purple-primary"
        onClick={closeModal}
        aria-label="Close modal"
      >
        <CloseIcon fill="currentColor" />
      </button>
      <p>
        Current balance: <span className="text-purple-primary font-semibold">{displayBalance(balance, 18, true)}</span>{" "}
        {COLLATERAL_TOKENS[chainId].secondary?.symbol}
      </p>
      {buttonByChain[chainId]}
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={chainId === mainnet.id ? paths.depositGuideEth() : paths.depositGuideGnosis()}
        className="text-purple-primary hover:underline text-[14px]"
      >
        View Full Guide
      </a>
    </div>
  );
}

export default DepositGuide;
