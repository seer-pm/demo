/**
 * Simple example: list outcomes on a MarketDetail page.
 *
 * Shows per outcome:
 * - User balance (amount of outcome tokens)
 * - Image (optional) and outcome name
 * - Current odds
 * - Link to token contract in block explorer
 * - Link to pool (if exists) or to create/add liquidity (if not)
 *
 * Uses @seer-pm/sdk and @seer-pm/react only. Optional outcome images
 * can be passed from the host app (e.g. from a CMS or market metadata).
 */

import * as React from "react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import type { Market } from "@seer-pm/sdk";
import {
  getTokenExplorerUrl,
  getLiquidityUrlByMarket,
  getPoolExplorerUrl,
  isInvalidOutcome,
} from "@seer-pm/sdk";
import {
  useTokenBalances,
  useTokensInfo,
  useMarketOdds,
  useMarketPools,
} from "@seer-pm/react";
import type { PoolInfo } from "@seer-pm/react";

const WRAPPED_DECIMALS = 18;

function formatBalance(amount: bigint, decimals: number): string {
  const n = Number(formatUnits(amount, decimals));
  if (n === 0) return "0";
  if (n < 0.0001) return "<0.0001";
  if (n < 1) return n.toFixed(4);
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function OddsDisplay({ odds }: { odds: number | null | undefined }) {
  if (odds == null || Number.isNaN(odds)) return <span>—</span>;
  const pct = (odds * 100).toFixed(1);
  return <span>{pct}%</span>;
}

export interface OutcomesListProps {
  market: Market;
  /** Optional image URLs per outcome index (e.g. from market metadata). */
  images?: string[];
}

export function OutcomesList({ market, images }: OutcomesListProps): React.ReactElement {
  const { address } = useAccount();
  const { data: balances } = useTokenBalances(address, market.wrappedTokens, market.chainId);
  const { data: tokensInfo = [] } = useTokensInfo(market.wrappedTokens, market.chainId);
  const { data: odds = [], isLoading: oddsLoading } = useMarketOdds(market, true);
  const { data: poolsByOutcome = [] } = useMarketPools(market);

  if (market.type === "Futarchy") {
    return (
      <div className="seer-outcomes-list">
        <p>Futarchy markets are not supported yet.</p>
      </div>
    );
  }

  const outcomeIndexes = market.wrappedTokens.map((_, i) => i);

  return (
    <div className="seer-outcomes-list space-y-3">
      <h2 className="text-lg font-medium mb-2">Outcomes</h2>
      <ul className="space-y-2 list-none p-0 m-0">
        {outcomeIndexes.map((i) => {
          const wrappedAddress = market.wrappedTokens[i];
          const name = market.outcomes[i] ?? `Outcome ${i + 1}`;
          const symbol = tokensInfo[i]?.symbol ?? name;
          const balance = balances?.[i] ?? 0n;
          const poolList = poolsByOutcome[i] as PoolInfo[] | undefined;
          const hasPool = Array.isArray(poolList) && poolList.length > 0;
          const firstPool = hasPool ? poolList[0] : null;
          const invalid = isInvalidOutcome(market, i);
          const imageUrl = images?.[i];

          return (
            <li
              key={`${market.id}-${i}`}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex flex-wrap items-center gap-3"
            >
              {/* Image */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                {imageUrl ? (
                  <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-xs text-gray-500"
                    title={name}
                  >
                    {invalid ? "∅" : (name.charAt(0) ?? "?")}
                  </div>
                )}
              </div>

              {/* Name + balance */}
              <div className="min-w-0 flex-1">
                <div className="font-medium">
                  {market.type === "Generic" && `#${i + 1} `}
                  {name}
                </div>
                {address && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Balance: {formatBalance(balance, WRAPPED_DECIMALS)} {symbol}
                  </div>
                )}
              </div>

              {/* Odds */}
              <div className="text-right font-mono">
                {oddsLoading ? (
                  <span className="text-gray-400">…</span>
                ) : (
                  <OddsDisplay odds={odds[i]} />
                )}
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-2 text-sm">
                <a
                  href={getTokenExplorerUrl(market.chainId, wrappedAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Contract
                </a>
                {hasPool && firstPool ? (
                  <a
                    href={getPoolExplorerUrl(market.chainId, firstPool.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Pool
                  </a>
                ) : (
                  <a
                    href={getLiquidityUrlByMarket(market, i)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Create pool
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
