import { createClient } from "@supabase/supabase-js";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi, zeroAddress, zeroHash } from "viem";
import { lightGeneralizedTcrAddress } from "../../src/hooks/contracts/generated";
import { GetImagesQuery, Status, getSdk as getCurateSdk } from "../../src/hooks/queries/gql-generated-curate";
import {
  GetMarketQuery,
  GetMarketsQuery,
  MarketType,
  Market_Filter,
  Market_OrderBy,
  OrderDirection,
  getSdk as getSeerSdk,
} from "../../src/hooks/queries/gql-generated-seer";
import { Market, SerializedMarket, VerificationResult, serializeMarket } from "../../src/hooks/useMarket";
import { MarketStatus } from "../../src/hooks/useMarketStatus";
import { SUPPORTED_CHAINS, SupportedChain } from "../../src/lib/chains";
import { FetchMarketParams, sortMarkets } from "../../src/lib/markets-search";
import { unescapeJson } from "../../src/lib/reality";
import { INVALID_RESULT_OUTCOME, INVALID_RESULT_OUTCOME_TEXT, isUndefined } from "../../src/lib/utils";
import { config } from "./utils/config";
import { curateGraphQLClient, graphQLClient } from "./utils/subgraph";
const crypto = require("node:crypto");

export const MARKETS_COUNT_PER_QUERY = 1000;

const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

async function getVerificationStatusList(
  chainId: SupportedChain,
): Promise<Record<Address, VerificationResult | undefined>> {
  const client = curateGraphQLClient(chainId);

  const registryAddress = lightGeneralizedTcrAddress[chainId];
  let litems: GetImagesQuery["litems"] = [];
  if (client && !isUndefined(registryAddress)) {
    try {
      const data = await getCurateSdk(client).GetImages({
        where: {
          registryAddress,
        },
      });
      litems = data.litems;
    } catch (e) {
      const fallbackClient = curateGraphQLClient(chainId, true);
      if (fallbackClient) {
        const data = await getCurateSdk(fallbackClient).GetImages({
          where: {
            registryAddress,
          },
        });
        litems = data.litems;
      } else {
        throw e;
      }
    }
    return litems.reduce(
      (obj, item) => {
        const marketId = item.metadata?.props?.find((prop) => prop.label === "Market")?.value?.toLowerCase();
        if (!marketId) {
          return obj;
        }
        const isVerifiedBeforeClearing =
          item.status === Status.ClearingRequested &&
          item.requests.find((request) => request.requestType === Status.RegistrationRequested)?.resolved;
        if (item.status === Status.Registered || isVerifiedBeforeClearing) {
          obj[marketId] = { status: "verified", itemID: item.itemID };
          return obj;
        }
        if (item.status === Status.RegistrationRequested) {
          if (item.disputed) {
            obj[marketId] = { status: "challenged", itemID: item.itemID };
          } else {
            obj[marketId] = { status: "verifying", itemID: item.itemID };
          }
          return obj;
        }
        obj[marketId] = { status: "not_verified" };
        return obj;
      },
      {} as { [key: string]: VerificationResult },
    );
  }

  return {};
}

interface MarketExtraData {
  id: string;
  liquidity: number | null;
  incentive: number | null;
  odds: (number | null)[];
  categories: string[];
  pool_balance: Array<{
    token0: { symbol: string; balance: number };
    token1: { symbol: string; balance: number };
  } | null>;
  url: string | null;
}

function mapGraphMarket(
  market: NonNullable<GetMarketQuery["market"]>,
  extra: {
    chainId: SupportedChain;
    verification: VerificationResult | undefined;
    liquidityUSD: number;
    incentive: number;
    hasLiquidity: boolean;
    categories: string[];
    poolBalance: MarketExtraData["pool_balance"];
    odds: (number | null)[];
    url: string;
  },
): Market {
  return {
    ...market,
    id: market.id as Address,
    marketName: unescapeJson(market.marketName),
    outcomes: market.outcomes.map((outcome) => {
      if (outcome === INVALID_RESULT_OUTCOME) {
        return INVALID_RESULT_OUTCOME_TEXT;
      }
      return unescapeJson(outcome);
    }),
    parentMarket: {
      id: (market.parentMarket?.id as Address) || zeroAddress,
      conditionId: market.parentMarket?.conditionId || zeroHash,
      payoutReported: market.parentMarket?.payoutReported || false,
      payoutNumerators: (market.parentMarket?.payoutNumerators || []).map((n) => BigInt(n)),
    },
    parentOutcome: BigInt(market.parentOutcome),
    templateId: BigInt(market.templateId),
    openingTs: Number(market.openingTs),
    questions: market.questions.map((question) => {
      return {
        ...question.question,
        id: question.question.id as `0x${string}`,
        opening_ts: Number(question.question.opening_ts),
        timeout: Number(question.question.timeout),
        finalize_ts: Number(question.question.finalize_ts),
        bond: BigInt(question.question.bond),
        min_bond: BigInt(question.question.min_bond),
      };
    }),
    outcomesSupply: BigInt(market.outcomesSupply),
    lowerBound: BigInt(market.lowerBound),
    upperBound: BigInt(market.upperBound),
    blockTimestamp: Number(market.blockTimestamp),
    payoutNumerators: market.payoutNumerators.map((n) => BigInt(n)),
    ...extra,
  };
}

async function getMarketsExtraData(): Promise<{ [key: string]: MarketExtraData } | undefined> {
  const { data, error } = await supabase.from("markets").select();
  if (error) {
    return;
  }

  return data.reduce(
    (acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    },
    {} as { [key: string]: MarketExtraData },
  );
}

async function fetchAllMarkets(chainId: SupportedChain, where?: Market_Filter) {
  const client = graphQLClient(chainId);

  if (!client) {
    throw new Error("Subgraph not available");
  }

  let markets: GetMarketsQuery["markets"] = [];
  const maxAttempts = 20;
  let attempt = 1;
  let currentId = undefined;
  // try to fetch all markets on subgraph

  while (attempt < maxAttempts) {
    const { markets: currentMarkets } = await getSeerSdk(client).GetMarkets({
      where: isUndefined(currentId) ? where : where ? { and: [where, { id_gt: currentId }] } : { id_gt: currentId },
      orderDirection: OrderDirection.Asc,
      orderBy: Market_OrderBy.Id,
      first: MARKETS_COUNT_PER_QUERY,
    });
    markets = markets.concat(currentMarkets);
    if (currentMarkets[currentMarkets.length - 1]?.id === currentId) {
      break;
    }
    if (currentMarkets.length < MARKETS_COUNT_PER_QUERY) {
      break; // We've fetched all markets
    }
    currentId = currentMarkets[currentMarkets.length - 1]?.id;
    attempt++;
  }
  return markets;
}

export const fetchMarkets = async (
  chainId: SupportedChain,
  where?: Market_Filter,
  orderBy?: Market_OrderBy,
  orderDirection?: "asc" | "desc",
): Promise<Market[]> => {
  const [markets, verificationStatusList, marketsExtraData] = await Promise.all([
    fetchAllMarkets(chainId, where),
    getVerificationStatusList(chainId),
    getMarketsExtraData(),
  ]);

  return markets
    .map((market) => {
      const marketExtraData = marketsExtraData?.[market.id.toLowerCase() as Address];
      return mapGraphMarket(market, {
        chainId,
        verification: verificationStatusList?.[market.id.toLowerCase() as Address] ?? { status: "not_verified" },
        liquidityUSD: marketExtraData?.liquidity ?? 0,
        incentive: marketExtraData?.incentive ?? 0,
        hasLiquidity: marketExtraData?.odds?.some((odd: number | null) => (odd ?? 0) > 0) ?? false,
        odds: marketExtraData?.odds ?? [],
        categories: marketExtraData?.categories ?? ["misc"],
        poolBalance: marketExtraData?.pool_balance || [],
        url: marketExtraData?.url || "",
      });
    })
    .sort(sortMarkets(orderBy, orderDirection || "desc"));
};

export async function searchGraphMarkets(
  chainId: SupportedChain,
  type: "Generic" | "Futarchy" | "",
  id: Address | "",
  parentMarket: Address | "",
  _marketName: string,
  marketStatusList: MarketStatus[] | undefined,
  creator: Address | "",
  participant: Address | "",
  orderBy: Market_OrderBy | undefined,
  orderDirection: "asc" | "desc" | undefined,
) {
  const now = String(Math.round(new Date().getTime() / 1000));

  let where: Market_Filter = {};
  const or = [];

  if (id) {
    where["id"] = id.toLowerCase();
  }

  if (parentMarket) {
    where["parentMarket"] = parentMarket.toLowerCase();
  }

  if (type) {
    where["type"] = type as MarketType;
  }

  if (marketStatusList?.includes(MarketStatus.NOT_OPEN)) {
    or.push({
      openingTs_gt: now,
    });
  }
  if (marketStatusList?.includes(MarketStatus.OPEN)) {
    or.push({
      openingTs_lt: now,
      hasAnswers: false,
    });
  }
  if (marketStatusList?.includes(MarketStatus.ANSWER_NOT_FINAL)) {
    or.push({
      openingTs_lt: now,
      hasAnswers: true,
      finalizeTs_gt: now,
    });
  }
  if (marketStatusList?.includes(MarketStatus.IN_DISPUTE)) {
    or.push({
      questionsInArbitration_gt: "0",
    });
  }
  if (marketStatusList?.includes(MarketStatus.PENDING_EXECUTION)) {
    or.push({
      finalizeTs_lt: now,
      payoutReported: false,
    });
  }
  if (marketStatusList?.includes(MarketStatus.CLOSED)) {
    or.push({
      payoutReported: true,
    });
  }

  if (or.length > 0) {
    where = {
      and: [where, { or }],
    };
  }

  if (participant) {
    // markets this user is a participant in (participant = creator or trader)
    const marketsWithUserPositions = (await fetchMarketsWithPositions(participant, chainId)).map((a) =>
      a.toLocaleLowerCase(),
    );
    if (marketsWithUserPositions.length > 0) {
      // the user is an active trader in some market
      where = {
        and: [
          where,
          {
            or: [{ id_in: marketsWithUserPositions }, { creator: participant }],
          },
        ],
      };
    } else {
      // the user is not trading, search only created markets
      where["creator"] = participant;
    }
  } else if (creator !== "") {
    where["creator"] = creator;
  }

  return await fetchMarkets(chainId, where, orderBy, orderDirection);
}

export const fetchMarketsWithPositions = async (address: Address, chainId: SupportedChain) => {
  // tokenId => marketId
  const tokenToMarket = (await fetchMarkets(chainId)).reduce(
    (acum, market) => {
      for (const tokenId of market.wrappedTokens) {
        acum[tokenId] = market.id;
      }
      return acum;
    },
    {} as Record<`0x${string}`, Address>,
  );

  // [tokenId, ..., ...]
  const allTokensIds = Object.keys(tokenToMarket) as `0x${string}`[];

  // [tokenBalance, ..., ...]
  const balances = (await readContracts(config, {
    contracts: allTokensIds.map((wrappedAddresses) => ({
      abi: erc20Abi,
      address: wrappedAddresses,
      functionName: "balanceOf",
      args: [address],
    })),
    allowFailure: false,
  })) as bigint[];

  // Set<marketWithBalance>
  const marketsWithTokens = balances.reduce((acumm, balance, index) => {
    if (balance > 0n) {
      acumm.add(tokenToMarket[allTokensIds[index]]);
    }
    return acumm;
  }, new Set<Address>());

  // [marketWithBalance, ..., ...]
  return [...marketsWithTokens];
};

async function getMarketId(id: string | undefined, url: string | undefined) {
  if (!id && !url) {
    return "";
  }

  if (url) {
    const { data: market } = await supabase.from("markets").select("id").eq("url", url).single();

    return market?.id || "";
  }

  return id || "";
}

async function multiChainSearch(body: FetchMarketParams): Promise<SerializedMarket[]> {
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
  } = body;

  // Market URLs are stored in Supabase rather than on-chain. If a URL parameter is provided,
  // we first look up the corresponding market ID in Supabase before querying the subgraph.
  const id = await getMarketId(body.id, body.url);

  const chainIds = (
    chainsList.length === 0 ? Object.keys(SUPPORTED_CHAINS) : chainsList.filter((chain) => chain !== "all")
  )
    .filter((chain) => chain !== "31337")
    .map((chainId) => Number(chainId)) as SupportedChain[];

  const markets = (
    await Promise.all(
      chainIds.map((chainId) =>
        searchGraphMarkets(
          chainId,
          type,
          id,
          parentMarket,
          marketName,
          marketStatusList,
          creator,
          participant,
          orderBy,
          orderDirection,
        ),
      ),
    )
  ).flat();

  // sort again because we are merging markets from multiple chains
  markets.sort(sortMarkets(orderBy, orderDirection || "desc"));

  return markets.map((market) => serializeMarket(market));
}

async function keyValueFetch<T>(key: string, callback: () => Promise<T>) {
  const { data, error } = await supabase.from("key_value").select("value").eq("key", key).single();

  if (error && error.code !== "PGRST116") {
    // Handle error if it's not a "not found" error
    throw error;
  }

  const currentTime = new Date();
  const fiveMinutesAgo = new Date(currentTime.getTime() - 5 * 60 * 1000);

  if (!data || new Date(data.value.date) < fiveMinutesAgo) {
    const result = await callback();

    const { error: saveError } = await supabase.from("key_value").upsert(
      {
        key,
        value: { date: currentTime.toISOString(), value: result },
      },
      { onConflict: "key" },
    );

    if (saveError) {
      throw saveError;
    }

    return result;
  }

  return data.value.value;
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
    const hashKey = `markets_search_${crypto.createHash("md5").update(JSON.stringify(body)).digest("hex")}`;
    const markets = await keyValueFetch(hashKey, () => multiChainSearch(body as FetchMarketParams));

    return new Response(JSON.stringify(markets), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    console.log(e);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
