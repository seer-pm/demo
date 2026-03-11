import { Alert } from "@/components/Alert";
import { TradeCollateralWidget } from "@/components/TradeCollateral/TradeCollateralWidget";
import { base, filterChain, optimism } from "@/lib/chains";
import { SupportedChain } from "@seer-pm/sdk";
import { useAccount } from "wagmi";

const COLLATERAL_CHAINS: SupportedChain[] = [base.id, optimism.id];

export default function TradeCollateralPage() {
  const { chainId: _chainId } = useAccount();
  const chainId = filterChain(_chainId);

  const isSupported = COLLATERAL_CHAINS.includes(chainId);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Trade Collateral</h1>
      <p className="text-base-content/70 mb-6">
        Swap between collateral tokens to fund your positions.
        <br />
        On Optimism or Base: sUSDS ↔ USDC or USDS.
      </p>
      {!isSupported ? (
        <Alert type="info">
          Connect to Optimism or Base to trade collateral. On Optimism or Base you can swap sUSDS with USDC or USDS.
        </Alert>
      ) : (
        <TradeCollateralWidget chainId={chainId} />
      )}
    </div>
  );
}
