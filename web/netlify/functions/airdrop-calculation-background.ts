import { getSwaprHistoryTokensPrices } from "@/hooks/portfolio/positionsTab/getSwaprPrices";
import { getUniswapHistoryTokensPrices } from "@/hooks/portfolio/positionsTab/getUniswapPrices";
import { Market } from "@/hooks/useMarket";
import { SupportedChain } from "@/lib/chains";
import { fetchMarkets } from "@/lib/markets-search";
import { isTwoStringsEqual } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import pLimit from "p-limit";
import { Address } from "viem";
import { gnosis, mainnet } from "viem/chains";
import { getAllTransfers, getHoldersAtTimestamp } from "./utils/airdropCalculation/getAllTransfers";
import {
  getAllLiquidityEvents,
  getLiquidityBalancesAtTimestamp,
} from "./utils/airdropCalculation/getLiquidityBalances";
import { getPOHVerifiedUsers, isPOHVerifiedUserAtTime } from "./utils/airdropCalculation/getPOHVerifiedUsers";
import { getPrices } from "./utils/airdropCalculation/getPrices";
import { getRandomNextDayTimestamp, getTokensByTimestamp } from "./utils/airdropCalculation/utils";

const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

const SER_LPP = {
  [gnosis.id]: "0xa7a7f8d1770c08e2e1f55d8c6427c1f8213a34da",
};

const SER_LPP_IGNORE_ADDRESSES = {
  [gnosis.id]: ["0xcAD3f887275c3b8409140ea61Ebb0b9751eDa287", "0x607bbfd4cebd869aad04331f8a2ad0c3c396674b"],
};

const START_TIME = 1728579600; //October 11, 2024

const SEER_PER_DAY = 200000000 / 30;

async function getAllTokens(markets: Market[]) {
  const marketIdToMarket = markets.reduce(
    (acum, market) => {
      acum[market.id] = market;
      return acum;
    },
    {} as { [key: string]: Market },
  );
  const tokens = markets.reduce(
    (acum, market) => {
      const parentMarket = marketIdToMarket[market.parentMarket.id];
      const parentTokenId = parentMarket ? parentMarket.wrappedTokens[Number(market.parentOutcome)] : undefined;
      for (let i = 0; i < market.wrappedTokens.length; i++) {
        const tokenId = market.wrappedTokens[i];
        acum.push({
          tokenId,
          parentTokenId,
        });
      }
      return acum;
    },
    [] as { tokenId: Address; parentTokenId?: Address }[],
  );
  return tokens;
}

async function getSnapshotData(markets: Market[], chainId: SupportedChain, timestamp: number) {
  // FETCHING DATA
  console.log("START FETCHING DATA ", { chainId, timestamp });
  // get tokens
  const tokens = await getAllTokens(markets);
  const tokensByTimestamp = getTokensByTimestamp(markets, timestamp);
  // get all transfers
  const transfers = await getAllTransfers(chainId);
  // get all liquidity events
  const liquidityEvents = await getAllLiquidityEvents(chainId, tokens);
  // get poh verified users
  const requests = await getPOHVerifiedUsers(chainId);
  // get prices at timestamps
  const processedPrices = await getPrices(tokens, chainId, timestamp);
  console.log({
    tokens: tokens.length,
    tokensByTimestamp: Object.keys(tokensByTimestamp).length,
    transfers: transfers.length,
    liquidityEvents: liquidityEvents.length,
    requests: requests.length,
    prices: Object.keys(processedPrices).length,
    chainId,
  });

  // START PROCESSING AIRDROP USERS
  const finalData = [];
  const users: {
    [key: string]: { directHolding: number; indirectHolding: number; isPOH: boolean; timestamp: number };
  } = {};
  const holdersAtTimestamp = getHoldersAtTimestamp(transfers, timestamp);
  const liquidityHoldersAtTimestamp = getLiquidityBalancesAtTimestamp(liquidityEvents, timestamp);
  const initialUser = {
    directHolding: 0,
    indirectHolding: 0,
    isPOH: false,
    timestamp,
  };
  Object.entries(holdersAtTimestamp).map(([holderAddress, tokenBalanceMapping]) => {
    if (!users[holderAddress]) {
      users[holderAddress] = initialUser;
    }
    users[holderAddress]["directHolding"] =
      (users[holderAddress]["directHolding"] ?? 0) +
      Object.entries(tokenBalanceMapping).reduce((acc, [tokenId, tokenBalance]) => {
        if (!tokensByTimestamp[tokenId as Address]) {
          return acc;
        }
        return acc + (processedPrices[tokenId] ?? 0) * tokenBalance;
      }, 0);
  });
  Object.entries(liquidityHoldersAtTimestamp).map(([holderAddress, tokenBalanceMapping]) => {
    if (!users[holderAddress]) {
      users[holderAddress] = initialUser;
    }
    users[holderAddress]["indirectHolding"] =
      (users[holderAddress]["indirectHolding"] ?? 0) +
      Object.entries(tokenBalanceMapping).reduce((acc, [tokenId, tokenBalance]) => {
        if (!tokensByTimestamp[tokenId as Address]) {
          return acc;
        }
        return acc + (processedPrices[tokenId] ?? 0) * tokenBalance;
      }, 0);
  });
  let total = 0;
  let pohTotal = 0;
  let serLppTotal = 0;
  for (const [holderAddress, holderData] of Object.entries(users)) {
    const totalHoldingPerUser = (holderData.directHolding ?? 0) + (holderData.indirectHolding ?? 0);
    const serLppHoldingPerUser =
      chainId === gnosis.id && SER_LPP_IGNORE_ADDRESSES[chainId].every((x) => !isTwoStringsEqual(x, holderAddress))
        ? (holdersAtTimestamp[holderAddress]?.[SER_LPP[chainId]] ?? 0)
        : 0;
    const isPOHUser = isPOHVerifiedUserAtTime(requests, holderAddress, timestamp);
    total += totalHoldingPerUser;
    serLppTotal += serLppHoldingPerUser;
    if (isPOHUser) {
      pohTotal += Math.sqrt(totalHoldingPerUser);
    }
  }
  for (const [holderAddress, holderData] of Object.entries(users)) {
    const totalHoldingPerUser = (holderData.directHolding ?? 0) + (holderData.indirectHolding ?? 0);
    const serLppHoldingPerUser =
      chainId === gnosis.id && SER_LPP_IGNORE_ADDRESSES[chainId].every((x) => !isTwoStringsEqual(x, holderAddress))
        ? (holdersAtTimestamp[holderAddress]?.[SER_LPP[chainId]] ?? 0)
        : 0;
    if (totalHoldingPerUser.toLocaleString() !== "0" || serLppHoldingPerUser > 0) {
      const isPOHUser = isPOHVerifiedUserAtTime(requests, holderAddress, timestamp);
      const shareOfHolding = total ? totalHoldingPerUser / total : 0;
      const shareOfHoldingPoh = isPOHUser && pohTotal > 0 ? Math.sqrt(totalHoldingPerUser) / pohTotal : 0;
      const shareOfHoldingSerLpp = serLppTotal ? serLppHoldingPerUser / serLppTotal : 0;
      const seerTokens = SEER_PER_DAY * (shareOfHolding * 0.25 + shareOfHoldingPoh * 0.25 + shareOfHoldingSerLpp * 0.5);
      finalData.push({
        address: holderAddress,
        isPOHUser,
        timestamp,
        totalHolding: totalHoldingPerUser,
        directHolding: holderData.directHolding ?? 0,
        indirectHolding: holderData.indirectHolding ?? 0,
        serLppHolding: serLppHoldingPerUser,
        shareOfHolding,
        shareOfHoldingPoh,
        shareOfHoldingSerLpp,
        seerTokens,
      });
    }
  }
  return finalData;
}

export default async () => {
  try {
    const { data, error } = await supabase
      .from("key_value")
      .select("value")
      .eq("key", "next_snapshot_timestamp")
      .single();
    if (error && error.code !== "PGRST116") {
      throw error;
    }
    const nextTimestamp = getRandomNextDayTimestamp(data?.value?.timestamp ? Number(data.value.timestamp) : START_TIME);
    console.log(nextTimestamp);
    const now = new Date().getTime();
    if (nextTimestamp * 1000 > now) {
      return;
    }
    const markets = await fetchMarkets();
    //gnosis
    const gnosisData = await getSnapshotData(
      markets.filter((x) => x.chainId === gnosis.id),
      gnosis.id,
      nextTimestamp,
    );
    //mainnet
    const mainnetData = await getSnapshotData(
      markets.filter((x) => x.chainId === mainnet.id),
      mainnet.id,
      nextTimestamp,
    );
    const allData = [
      ...gnosisData.map((x) => ({ ...x, chainId: gnosis.id })),
      ...mainnetData.map((x) => ({ ...x, chainId: mainnet.id })),
    ];
    console.log({ gnosisData: gnosisData.length, mainnetData: mainnetData.length });
    //write to supabase
    const { error: writeError } = await supabase.from("airdrops").insert(
      allData.map((data) => ({
        address: data.address,
        chain_id: data.chainId,
        is_poh: data.isPOHUser,
        timestamp: new Date(nextTimestamp * 1000),
        total_holding: data.totalHolding ?? 0,
        direct_holding: data.directHolding ?? 0,
        indirect_holding: data.indirectHolding ?? 0,
        ser_lpp_holding: data.serLppHolding ?? 0,
        share_of_holding: data.shareOfHolding ?? 0,
        share_of_holding_poh: data.shareOfHoldingPoh ?? 0,
        share_of_holding_ser_lpp: data.shareOfHoldingSerLpp ?? 0,
        seer_tokens_count: data.seerTokens ?? 0,
      })),
    );

    if (writeError) {
      throw writeError;
    }
    const { error: upsertError } = await supabase.from("key_value").upsert(
      {
        key: "next_snapshot_timestamp",
        value: { timestamp: nextTimestamp },
      },
      { onConflict: "key" },
    );

    if (upsertError) {
      console.error("Save new timestamp failed:", upsertError);
    }
  } catch (e) {
    console.log(e);
  }
};
