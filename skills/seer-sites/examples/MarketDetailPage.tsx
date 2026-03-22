import React from "react";
import type { Market, SupportedChain, VerificationStatus } from "@seer-pm/sdk";
import { MarketStatus, getMarketType, MARKET_TYPES_TEXTS, getMarketStatus, STATUS_TEXTS, getRedeemRouter } from "@seer-pm/sdk";
import type { Address } from "viem";
import { useAccount } from "wagmi";
import { useMarket, useMarketHasLiquidity } from "@seer-pm/react";
import { useWinningPositions } from "@seer-pm/react";
import { OutcomesList } from "./OutcomesList";
import { SwapWidget } from "./SwapWidget";

function formatUsd(amount: number): string {
  if (!amount || Number.isNaN(amount)) return "0.00";
  if (amount < 0.01) return "<0.01";
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getVerificationLabel(status: VerificationStatus | undefined): string {
  if (!status) return "Not available";
  switch (status) {
    case "verified":
      return "Verified";
    case "verifying":
      return "Verifying";
    case "challenged":
      return "Challenged";
    case "not_verified":
      return "Not verified";
    default:
      return String(status);
  }
}

type MarketDetailPageProps = {
  marketId: Address;
  chainId: SupportedChain;
};

export const MarketDetailPage: React.FC<MarketDetailPageProps> = ({ marketId, chainId }) => {
  const { address } = useAccount();
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
  const seerMarketPath = `https://app.seer.pm/markets/${market.chainId}/${market.url || market.id}`;
  const redeemRouter = getRedeemRouter(false, market);
  const { data: winningPositionsData } = useWinningPositions(address, market, redeemRouter);
  const hasWinningPositionsToRedeem =
    !!winningPositionsData?.winningPositions && winningPositionsData.winningOutcomeIndexes.length > 0;

  return (
    <div className="seer-market-detail-page">
      <h1 className="text-2xl font-semibold mb-2">{market.marketName}</h1>
      <div className="mb-4 text-xs text-gray-500">
        <div>Market ID: {market.id}</div>
        <div>Type: {typeText}</div>
        <div>Status: {statusText}</div>
        <div>Chain ID: {market.chainId}</div>
        <div>Liquidity (USD): {formatUsd(market.liquidityUSD)}</div>
        <div>Verification: {getVerificationLabel(market.verification?.status)}</div>
        <div>
          Seer link:{" "}
          <a href={seerMarketPath} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
            {seerMarketPath}
          </a>
        </div>
      </div>

      <div className="mb-6">
        <OutcomesList market={market} />
      </div>

      <div>
        <h2 className="text-lg font-medium mb-2">Trade</h2>
        {/* Requires react-toastify, ToastContainer, and import "react-toastify/dist/ReactToastify.css". See toastify.tsx in this folder. */}
        <SwapWidget market={market} />
      </div>

      {getMarketStatus(market) === MarketStatus.CLOSED && address && hasWinningPositionsToRedeem && (
        <div className="mt-8 border-t border-gray-200 pt-4">
          <h2 className="text-lg font-medium mb-2">Redeem</h2>
          <p className="mb-2 text-sm text-gray-600">
            This market is closed and this account has winning positions to redeem.
          </p>
          <a
            href={seerMarketPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-purple-600 hover:underline"
          >
            Redeem on Seer
          </a>
        </div>
      )}
    </div>
  );
};

