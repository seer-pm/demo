import React from "react";
import type { Market } from "@seer-pm/sdk";
import { getMarketType, MARKET_TYPES_TEXTS, getMarketStatus, STATUS_TEXTS } from "@seer-pm/sdk";
import { useMarkets, useMarketHasLiquidity } from "@seer-pm/react";

function MarketCard({ market }: { market: Market }) {
  const hasLiquidity = useMarketHasLiquidity(market);
  const typeText = MARKET_TYPES_TEXTS[getMarketType(market)];
  const statusText = STATUS_TEXTS[getMarketStatus(market)](hasLiquidity);

  const handleClick = () => {
    // In Seer, markets are addressed by:
    //   /markets/{chainId}/{slug}
    // where `slug` is the `market.url` field from the SDK.
    //
    // The app's router (Next.js, React Router, etc.) should handle this
    // route and render the MarketDetailPage example for /markets/:chainId/:slug.
    const path = `/markets/${market.chainId}/${market.url}`;
    if (typeof window !== "undefined") {
      window.location.href = path;
    }
  };

  return (
    <button
      type="button"
      className="border rounded-lg p-4 text-left hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      onClick={handleClick}
    >
      <h2 className="text-lg font-medium mb-2">{market.marketName}</h2>
      <p className="text-xs text-gray-500">
        Type: {typeText} · Status: {statusText}
      </p>
    </button>
  );
}

export const MarketsPage: React.FC = () => {
  const { data, isLoading, error } = useMarkets({
    // Optional filters:
    // - Set `creator` to show only markets created by a given address.
    // - Set `marketName` to search markets by name.
    // - Set `marketIds` to fetch a specific list of markets.
    // - Set `chainsList` to restrict markets to specific chains.
    // creator: "0xCreatorAddressHere",
    // marketName: "Search text",
    // marketIds: ["0xMarketId1", "0xMarketId2"],
    // chainsList: ["100", "8453"], // example: Gnosis + Base
  });

  if (isLoading) {
    return <div>Loading markets…</div>;
  }

  if (error) {
    return <div>Failed to load markets: {String(error)}</div>;
  }

  if (!data || data.markets.length === 0) {
    return <div>No markets available yet.</div>;
  }

  return (
    <div className="seer-markets-page">
      <h1 className="text-2xl font-semibold mb-4">Prediction Markets</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.markets.map((market: Market) => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>
    </div>
  );
};

