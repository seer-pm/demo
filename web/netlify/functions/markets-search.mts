import { SUPPORTED_CHAINS, SupportedChain, sepolia } from "@/lib/chains";
import { SerializedMarket, serializeMarket } from "@/lib/market";
import { FetchMarketParams, sortMarkets } from "@/lib/markets-search";
import { Address } from "viem";
import { searchMarkets } from "./utils/markets";

async function multiChainSearch(body: FetchMarketParams, id: Address | ""): Promise<SerializedMarket[]> {
  const {
    chainsList = [],
    type = "",
    parentMarket = "",
    marketName = "",
    marketStatusList,
    creator = "",
    participant = "",
    orderBy,
    orderDirection,
    marketIds,
  } = body;

  const chainIds =
    process.env.VITE_TESTNET_WEBSITE === "1"
      ? [sepolia.id]
      : ((chainsList.length === 0 ? Object.keys(SUPPORTED_CHAINS) : chainsList.filter((chain) => chain !== "all"))
          .filter((chain) => chain !== "31337")
          .map((chainId) => Number(chainId)) as SupportedChain[]);

  const markets = await searchMarkets(
    chainIds,
    type,
    id,
    parentMarket,
    marketName,
    marketStatusList,
    creator,
    participant,
    marketIds,
  );

  markets.sort(sortMarkets(orderBy, orderDirection || "desc"));

  return markets.map((market) => serializeMarket(market));
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
    const markets: SerializedMarket[] = await multiChainSearch(body as FetchMarketParams, "");

    return new Response(JSON.stringify(markets), {
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
