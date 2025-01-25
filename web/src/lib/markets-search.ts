import { STATUS_TEXTS } from "@/components/Market/Header";
import { Market_Filter, Market_OrderBy } from "@/hooks/queries/gql-generated-seer";
import { Market } from "@/hooks/useMarket";
import { MarketStatus, getMarketStatus } from "@/hooks/useMarketStatus";
import { zeroAddress } from "viem";
import { SupportedChain } from "./chains";

export const fetchMarkets = async (
  chainId: SupportedChain,
  where?: Market_Filter,
  orderBy?: Market_OrderBy,
  orderDirection?: "asc" | "desc",
): Promise<Market[]> => {
  // TODO
  console.log(chainId, where, orderBy, orderDirection);

  return [];
};

export function sortMarkets(
  orderBy: Market_OrderBy | "liquidityUSD" | "creationDate" | undefined,
  orderDirection: "asc" | "desc",
) {
  const STATUS_PRIORITY = {
    verified: 0,
    verifying: 1,
    challenged: 2,
    not_verified: 3,
  };
  const directionMultiplier = orderDirection === "asc" ? -1 : 1;
  return (a: Market, b: Market) => {
    if (!orderBy) {
      // closed markets will be put on the back
      try {
        const marketStatusA = getMarketStatus(a);
        const marketStatusB = getMarketStatus(b);

        if (marketStatusA !== marketStatusB) {
          if (marketStatusA === MarketStatus.CLOSED) return 1;
          if (marketStatusB === MarketStatus.CLOSED) return -1;
        }
      } catch (e) {
        console.log(e);
      }

      //if underlying token is worthless we put it after
      if (a.parentMarket.id !== zeroAddress || b.parentMarket.id !== zeroAddress) {
        const underlyingAWorthless =
          a.parentMarket.id !== zeroAddress &&
          a.parentMarket.payoutReported &&
          a.parentMarket.payoutNumerators[Number(a.parentOutcome)] === 0n;
        const underlyingBWorthless =
          b.parentMarket.id !== zeroAddress &&
          b.parentMarket.payoutReported &&
          b.parentMarket.payoutNumerators[Number(b.parentOutcome)] === 0n;

        if (underlyingAWorthless !== underlyingBWorthless) {
          return underlyingAWorthless ? 1 : -1;
        }
      }

      //by verification status
      const statusDiff =
        STATUS_PRIORITY[a.verification?.status || "not_verified"] -
        STATUS_PRIORITY[b.verification?.status || "not_verified"];
      if (statusDiff !== 0) {
        return statusDiff;
      }

      // if market has no liquidity we not prioritize it
      try {
        const statusTextA = STATUS_TEXTS[getMarketStatus(a)](a.hasLiquidity);
        const statusTextB = STATUS_TEXTS[getMarketStatus(b)](b.hasLiquidity);
        if (statusTextA !== statusTextB) {
          if (statusTextA === "Liquidity Required") return 1;
          if (statusTextB === "Liquidity Required") return -1;
        }
      } catch (e) {
        console.log(e);
      }

      // by liquidity
      return b.liquidityUSD - a.liquidityUSD;
    }

    if (orderBy === "liquidityUSD") {
      return (b.liquidityUSD - a.liquidityUSD) * directionMultiplier;
    }

    if (orderBy === "creationDate") {
      return (Number(b.blockTimestamp) - Number(a.blockTimestamp)) * directionMultiplier;
    }
    // by opening date
    return (b.openingTs - a.openingTs) * directionMultiplier;
  };
}
