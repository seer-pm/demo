import type { PortfolioPosition } from "@/hooks/portfolio/positionsTab/usePortfolioPositions";
import type { SupportedChain } from "@seer-pm/sdk";
import { MarketTypes, getMarketStatus, getMarketType, getQuestionParts, getRedeemedPrice } from "@seer-pm/sdk/market";
import { getCollateralByIndex } from "@seer-pm/sdk/market-pools";
import { MarketStatus } from "@seer-pm/sdk/market-types";
import { createClient } from "@supabase/supabase-js";
import { type Address, erc20Abi, formatUnits } from "viem";
import { multicall } from "viem/actions";
import { getPublicClientByChainId } from "./utils/config";
import { getMarketsMappings, searchMarkets } from "./utils/markets";
import { Database } from "./utils/supabase";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

async function getTokensByAccount(address: Address, chainId: SupportedChain) {
  const { data, error } = await supabase
    .from("tokens_holdings_v")
    .select("token, owner, balance")
    .eq("owner", address.toLowerCase())
    .gt("balance", 0)
    .eq("chain_id", chainId)
    .order("token", { ascending: true })
    .order("balance", { ascending: false });

  if (error) {
    throw new Error(`Error·fetching·positions:·${error.message}`);
  }

  const rows = data ?? [];
  const tokens = rows.map((row) => row.token as Address);
  const balances = rows.map((row) => BigInt(row.balance as number));

  let names: string[] = [];
  let decimals: number[] = [];

  if (tokens.length > 0) {
    const publicClient = getPublicClientByChainId(chainId);
    const [namesResult, decimalsResult] = await Promise.all([
      multicall(publicClient, {
        contracts: tokens.map((tokenAddress) => ({
          abi: erc20Abi,
          address: tokenAddress,
          functionName: "name",
          args: [],
        })),
        allowFailure: false,
      }) as Promise<string[]>,
      multicall(publicClient, {
        contracts: tokens.map((tokenAddress) => ({
          abi: erc20Abi,
          address: tokenAddress,
          functionName: "decimals",
          args: [],
        })),
        allowFailure: false,
      }) as Promise<number[]>,
    ]);
    names = namesResult;
    decimals = decimalsResult;
  }

  return { tokens, balances, names, decimals };
}

async function fetchPositions(address: Address, chainId: SupportedChain) {
  const {
    tokens: allTokensIds,
    balances,
    names: tokenNames,
    decimals: tokenDecimals,
  } = await getTokensByAccount(address, chainId);
  const { markets } = await searchMarkets({ chainIds: [chainId], tokens: allTokensIds });

  if (markets.length === 0) {
    return [];
  }

  const { marketIdToMarket, tokenToMarket } = getMarketsMappings(markets);
  return balances.reduce((acumm, balance, index) => {
    if (balance > 0n) {
      if (!tokenToMarket[allTokensIds[index]]) {
        console.log("Missing market for token", allTokensIds[index]);
        return acumm;
      }

      const { market, tokenIndex } = tokenToMarket[allTokensIds[index]];
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
      const tokenBalance = Number(formatUnits(balance, Number(tokenDecimals[index])));
      // hide too small positions
      if (tokenBalance < 0.00001) {
        return acumm;
      }
      acumm.push({
        marketId: market.id,
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
