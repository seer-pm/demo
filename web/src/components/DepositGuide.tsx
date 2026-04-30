import { gnosis } from "@/lib/chains";
import { CloseIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { displayBalance } from "@/lib/utils";
import type { SupportedChain } from "@seer-pm/sdk";
import { base, mainnet, optimism, sepolia } from "viem/chains";

function DepositGuide({
  closeModal,
  chainId,
  balance,
  symbol,
}: {
  closeModal: () => void;
  chainId: SupportedChain;
  balance: bigint;
  symbol: string;
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
    [optimism.id]: (
      <a target="_blank" rel="noopener noreferrer" href="/trade-collateral" className="btn btn-primary">
        Trade Collateral
      </a>
    ),
    [base.id]: (
      <a target="_blank" rel="noopener noreferrer" href="/trade-collateral" className="btn btn-primary">
        Trade Collateral
      </a>
    ),
  };
  const guideByChain = {
    [gnosis.id]: paths.depositGuideGnosis(),
    [mainnet.id]: paths.depositGuideEth(),
    [sepolia.id]: null,
    [optimism.id]: paths.dappGuide(),
    [base.id]: paths.dappGuide(),
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
        {symbol}
      </p>
      {buttonByChain[chainId]}
      {guideByChain[chainId] && (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={guideByChain[chainId]}
          className="text-purple-primary hover:underline text-[14px]"
        >
          View Full Guide
        </a>
      )}
    </div>
  );
}

export default DepositGuide;
