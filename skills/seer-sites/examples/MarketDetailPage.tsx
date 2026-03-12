import React from "react";
import type { Market, SupportedChain } from "@seer-pm/sdk";
import { getMarketType, MARKET_TYPES_TEXTS, getMarketStatus, STATUS_TEXTS } from "@seer-pm/sdk";
import type { Address } from "viem";
import { useMarket, useMarketHasLiquidity } from "@seer-pm/react";
import { SwapWidget } from "./SwapWidget";

type MarketDetailPageProps = {
  marketId: Address;
  chainId: SupportedChain;
};

export const MarketDetailPage: React.FC<MarketDetailPageProps> = ({ marketId, chainId }) => {
  const { data, isLoading, error } = useMarket(marketId, chainId);

  if (isLoading) {
    return <div>Loading market…</div>;
  }

  if (error || !data) {
    return <div>Failed to load market.</div>;
  }

  const market: Market = data;
  const hasLiquidity = useMarketHasLiquidity(market);
  const typeText = MARKET_TYPES_TEXTS[getMarketType(market)];
  const statusText = STATUS_TEXTS[getMarketStatus(market)](hasLiquidity);

  return (
    <div className="seer-market-detail-page">
      <h1 className="text-2xl font-semibold mb-2">{market.marketName}</h1>
      <div className="mb-4 text-xs text-gray-500">
        <div>Market ID: {market.id}</div>
        <div>Type: {typeText}</div>
        <div>Status: {statusText}</div>
        <div>Chain ID: {market.chainId}</div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">Outcomes</h2>
        <ul className="list-disc list-inside space-y-1">
          {market.outcomes.map((outcome) => (
            <li key={outcome}>{outcome}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-2">Trade</h2>
        {/* Requires react-toastify, ToastContainer, and import "react-toastify/dist/ReactToastify.css". See toastify.tsx in this folder. */}
        <SwapWidget market={market} />
      </div>
    </div>
  );
};

