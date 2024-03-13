import { Alert } from "@/components/Alert";
import { ConditionalTokenActions } from "@/components/Market/ConditionalTokenActions";
import { MarketHeader } from "@/components/Market/MarketHeader";
import { Outcomes } from "@/components/Market/Outcomes";
import { SwapTokens } from "@/components/Market/SwapTokens";
import { Spinner } from "@/components/Spinner";
import { useMarket } from "@/hooks/useMarket";
import { useWrappedAddresses } from "@/hooks/useWrappedAddresses";
import { SupportedChain } from "@/lib/chains";
import { getRouterAddress } from "@/lib/config";
import { HomeIcon } from "@/lib/icons";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Address } from "viem";
import { useAccount } from "wagmi";

function MarketBreadcrumb() {
  return (
    <div className="flex items-center space-x-2 text-[#B38FFF] text-[14px]">
      <HomeIcon />
      <div>/</div>
      <div className="font-semibold">Market</div>
    </div>
  );
}

function MarketPage() {
  const { address: account } = useAccount();

  const [outcomeIndex, setOutcomeIndex] = useState(0);

  const params = useParams();
  const id = params.id as Address;
  const chainId = Number(params.chainId) as SupportedChain;

  const router = getRouterAddress(chainId);

  const { data: market, isError: isMarketError, isPending: isMarketPending } = useMarket(id as Address, chainId);
  const { data: wrappedAddresses = [] } = useWrappedAddresses(
    chainId,
    router,
    market?.conditionId,
    market?.outcomes.length,
  );

  if (isMarketError) {
    return (
      <div className="py-10 px-10">
        <Alert type="error" className="mb-5">
          Market not found
        </Alert>
      </div>
    );
  }

  if (isMarketPending || !router || !market) {
    return (
      <div className="py-10 px-10">
        <Spinner />
      </div>
    );
  }

  const tradeCallback = (poolIndex: number) => {
    setOutcomeIndex(poolIndex);
  };

  const outcomeToken = {
    address: wrappedAddresses[outcomeIndex],
    decimals: 18,
    symbol: "SEER_OUTCOME", // it's not used
  };

  return (
    <div className="py-10 px-10">
      <div className="space-y-5">
        <MarketBreadcrumb />

        <MarketHeader market={market} chainId={chainId} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="col-span-1 lg:col-span-8 space-y-5">
            {market && <Outcomes chainId={chainId} router={router} market={market} tradeCallback={tradeCallback} />}
          </div>
          <div className="col-span-1 lg:col-span-4 space-y-5">
            <SwapTokens
              account={account}
              chainId={chainId}
              outcomeText={market.outcomes[outcomeIndex]}
              outcomeToken={outcomeToken}
            />

            <ConditionalTokenActions chainId={chainId} router={router} market={market} account={account} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketPage;
