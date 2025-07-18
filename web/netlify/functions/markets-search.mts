import { SUPPORTED_CHAINS, SupportedChain, sepolia } from "@/lib/chains";
import { SerializedMarket, serializeMarket } from "@/lib/market";
import { FetchMarketParams } from "@/lib/markets-fetch";
import { Address } from "viem";
import { searchMarkets } from "./utils/markets";

async function multiChainSearch(
  body: FetchMarketParams,
  id: Address | "",
): Promise<{ markets: SerializedMarket[]; count: number; pages: number }> {
  const {
    chainsList = [],
    parentMarket = "",
    marketName = "",
    categoryList,
    marketStatusList,
    verificationStatusList,
    showConditionalMarkets,
    showMarketsWithRewards,
    minLiquidity,
    creator = "",
    participant = "",
    orderBy,
    orderDirection,
    marketIds,
    limit = 1000,
    page = 1,
  } = body;

  const chainIds =
    process.env.VITE_TESTNET_WEBSITE === "1"
      ? [sepolia.id]
      : ((chainsList.length === 0 ? Object.keys(SUPPORTED_CHAINS) : chainsList.filter((chain) => chain !== "all"))
          .filter((chain) => chain !== "31337")
          .map((chainId) => Number(chainId)) as SupportedChain[]);

  const { markets, count } = await searchMarkets(
    chainIds,
    id,
    parentMarket,
    marketName,
    categoryList,
    marketStatusList,
    verificationStatusList,
    showConditionalMarkets,
    showMarketsWithRewards,
    minLiquidity,
    creator,
    participant,
    marketIds,
    limit,
    page,
    orderBy,
    orderDirection,
  );

  return {
    markets: markets.map((market) => serializeMarket(market)),
    count,
    pages: Math.ceil(count / limit),
  };
}

export default async (req: Request) => {
  const body = await req.json();

  if (!body) {
    return new Response(JSON.stringify({ error: "Missing request body" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const result = await multiChainSearch(body as FetchMarketParams, "");

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    console.log(e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
