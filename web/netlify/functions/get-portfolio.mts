import { PortfolioPosition } from "@/hooks/portfolio/positionsTab/usePortfolioPositions";
import { getTokensInfo } from "@/hooks/portfolio/utils";
import { SupportedChain } from "@/lib/chains";
import {
  Market,
  MarketStatus,
  MarketTypes,
  getCollateralByIndex,
  getMarketStatus,
  getMarketType,
  getQuestionParts,
  getRedeemedPrice,
} from "@/lib/market";
import { Address, formatUnits } from "viem";
import { config } from "./utils/config";
import { searchMarkets } from "./utils/markets";

function getMarketsMappings(markets: Market[]) {
  return markets.reduce(
    (acum, market) => {
      // Add market to marketIdToMarket mapping
      acum.marketIdToMarket[market.id] = market;

      // Add token mappings to tokenToMarket
      for (let i = 0; i < market.wrappedTokens.length; i++) {
        const tokenId = market.wrappedTokens[i];
        acum.tokenToMarket[tokenId] = {
          marketId: market.id,
          tokenIndex: i,
        };
      }

      return acum;
    },
    {
      marketIdToMarket: {} as Record<Address, Market>,
      tokenToMarket: {} as Record<Address, { marketId: Address; tokenIndex: number }>,
    },
  );
}

async function fetchPositions(address: Address, chainId: SupportedChain) {
  const { markets } = await searchMarkets([chainId]);

  if (markets.length === 0) {
    return [];
  }

  const { marketIdToMarket, tokenToMarket } = getMarketsMappings(markets);

  const allTokensIds = Object.keys(tokenToMarket) as Address[];
  const {
    balances,
    names: tokenNames,
    decimals: tokenDecimals,
  } = await getTokensInfo(config, chainId, allTokensIds, address);

  return balances.reduce((acumm, balance, index) => {
    if (balance > 0n) {
      const { marketId, tokenIndex } = tokenToMarket[allTokensIds[index]];
      const market = marketIdToMarket[marketId];
      const parentMarket = marketIdToMarket[market.parentMarket.id];
      const outcomeIndex = market.wrappedTokens.indexOf(allTokensIds[index]);
      const isInvalidOutcome = market.type === "Generic" && outcomeIndex === market.wrappedTokens.length - 1;
      const marketType = getMarketType(market);
      const marketStatus = getMarketStatus(market);

      if (marketStatus === MarketStatus.CLOSED) {
        const isWinningPayout = market.payoutReported && market.payoutNumerators[tokenIndex] > 0n;
        const isParentPayoutPendingOrWinning =
          !market.parentMarket.payoutReported ||
          (market.parentMarket.payoutReported &&
            market.parentMarket.payoutNumerators[Number(market.parentOutcome)] > 0n);
        if (!isWinningPayout || !isParentPayoutPendingOrWinning) {
          // Skip this token since the market is closed and neither this token nor its parent market
          // represent winning outcomes, meaning the token has no redemption value
          return acumm;
        }
      }

      const parts = getQuestionParts(market.marketName, marketType);
      const marketName =
        marketType === MarketTypes.MULTI_SCALAR && parts
          ? `${parts?.questionStart} ${market.outcomes[outcomeIndex]} ${parts?.questionEnd}`.trim()
          : market.marketName;
      acumm.push({
        marketId,
        tokenIndex,
        tokenName: tokenNames[index],
        tokenId: allTokensIds[index],
        tokenBalance: Number(formatUnits(balance, Number(tokenDecimals[index]))),
        marketName,
        marketStatus,
        marketFinalizeTs: market.finalizeTs,
        outcome: market.outcomes[outcomeIndex],
        collateralToken: getCollateralByIndex(market, tokenIndex),
        parentMarketName: parentMarket?.marketName,
        parentMarketId: parentMarket?.id,
        parentOutcome: parentMarket ? parentMarket.outcomes[Number(market.parentOutcome)] : undefined,
        redeemedPrice: getRedeemedPrice(market, tokenIndex),
        outcomeImage: market.images?.outcomes?.[outcomeIndex],
        isInvalidOutcome,
      });
    }
    return acumm;
  }, [] as PortfolioPosition[]);
}

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const account = url.searchParams.get("account");
    const chainId = url.searchParams.get("chainId");

    // Validate required parameters
    if (!account) {
      return new Response(JSON.stringify({ error: "Account parameter is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    if (!chainId) {
      return new Response(JSON.stringify({ error: "ChainId parameter is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Convert chainId to number and validate it's a supported chain
    const chainIdNum = Number.parseInt(chainId, 10);
    if (Number.isNaN(chainIdNum)) {
      return new Response(JSON.stringify({ error: "chainId must be a valid number" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const positions = await fetchPositions(account as Address, chainIdNum as SupportedChain);

    return new Response(JSON.stringify(positions), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    console.log(e);
    return new Response(JSON.stringify({ error: e.message || "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
