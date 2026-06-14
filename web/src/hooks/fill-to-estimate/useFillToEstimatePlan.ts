import { useTicksData } from "@/hooks/liquidity/useTicksData";
import { useMarketOdds, useTokenBalance } from "@seer-pm/react";
import {
  type FillToEstimatePlan,
  type FillToEstimatePoolData,
  buildFillToEstimatePlan,
  isFillToEstimateEnabled,
} from "@seer-pm/sdk";
import type { Market, Token } from "@seer-pm/sdk";
import { useMemo } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";

interface UseFillToEstimatePlanParams {
  market: Market;
  targetEstimate?: number;
  maxCollateralToUse?: bigint;
  collateralToken: Token;
  enabled?: boolean;
}

export function useFillToEstimatePlan({
  market,
  targetEstimate,
  maxCollateralToUse,
  collateralToken,
  enabled = true,
}: UseFillToEstimatePlanParams) {
  const { address: account } = useAccount();
  const { data: odds = [] } = useMarketOdds(market, enabled && isFillToEstimateEnabled(market));

  const { data: ticks0 } = useTicksData(market, 0);
  const { data: ticks1 } = useTicksData(market, 1);

  const { data: collateralBalance = 0n } = useTokenBalance(account, collateralToken.address, market.chainId);
  const { data: outcome0Balance = 0n } = useTokenBalance(account, market.wrappedTokens[0] as Address, market.chainId);
  const { data: outcome1Balance = 0n } = useTokenBalance(account, market.wrappedTokens[1] as Address, market.chainId);

  return useMemo<FillToEstimatePlan | undefined>(() => {
    if (!enabled || !isFillToEstimateEnabled(market) || targetEstimate === undefined || Number.isNaN(targetEstimate)) {
      return undefined;
    }

    if (!odds.length || !ticks0 || !ticks1) {
      return undefined;
    }

    const pool0Entry = Object.values(ticks0)[0];
    const pool1Entry = Object.values(ticks1)[0];
    if (!pool0Entry || !pool1Entry) {
      return undefined;
    }

    const pools: [FillToEstimatePoolData | undefined, FillToEstimatePoolData | undefined] = [
      {
        pool: pool0Entry.poolInfo,
        ticks: pool0Entry.ticks,
        outcomeAddress: market.wrappedTokens[0] as Address,
      },
      {
        pool: pool1Entry.poolInfo,
        ticks: pool1Entry.ticks,
        outcomeAddress: market.wrappedTokens[1] as Address,
      },
    ];

    return buildFillToEstimatePlan({
      market,
      targetEstimate,
      currentOdds: odds.map((odd) => (odd === null ? Number.NaN : odd)),
      balances: {
        collateral: collateralBalance,
        outcome0: outcome0Balance,
        outcome1: outcome1Balance,
      },
      maxCollateralToUse,
      pools,
    });
  }, [
    enabled,
    market,
    targetEstimate,
    maxCollateralToUse,
    odds,
    ticks0,
    ticks1,
    collateralBalance,
    outcome0Balance,
    outcome1Balance,
  ]);
}

export function getOutcomeTokenForIndex(market: Market, outcomeIndex: 0 | 1): Token {
  return {
    address: market.wrappedTokens[outcomeIndex] as Address,
    chainId: market.chainId,
    decimals: 18,
    symbol: market.outcomes[outcomeIndex],
  };
}
