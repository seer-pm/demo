import { SupportedChain } from "@/lib/chains";
import { createClient } from "@supabase/supabase-js";
import { Address } from "viem";
import { gnosis, mainnet } from "viem/chains";
import { fetchSubgraphMarkets } from "./utils/airdropCalculation/getAllMarkets";
import { getAllTokens } from "./utils/airdropCalculation/getAllTokens";
import {
  getAllFutarchyTransfers,
  getAllTransfers,
  getHoldersAtTimestamp,
} from "./utils/airdropCalculation/getAllTransfers";
import {
  BunniPositionSnapshot,
  getBunniLpTokensByTokenPairs,
  getBunniPositionHoldersAtTimestamp,
  getBunniPositionSnapshots,
} from "./utils/airdropCalculation/getBunniData";
import {
  getAllLiquidityEvents,
  getLiquidityBalancesAtTimestamp,
} from "./utils/airdropCalculation/getLiquidityBalances";
import { getPOHVerifiedUsers, isPOHVerifiedUserAtTime } from "./utils/airdropCalculation/getPOHVerifiedUsers";
import {
  PositionSnapshot,
  getLiquidityBalancesByPositionAtTimestamp,
  getPositionSnapshotsByTokenPairs,
} from "./utils/airdropCalculation/getPositionSnapshots";
import { getPrices } from "./utils/airdropCalculation/getPrices";
import { getRandomNextDayTimestamp, getTokensByTimestamp, mergeTokenBalances } from "./utils/airdropCalculation/utils";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

const START_TIME = 1728579600; //October 11, 2024

const SEER_PER_DAY = 200000000 / 30;

async function getSnapshotData(chainId: SupportedChain, timestamp: number) {
  // FETCHING DATA
  console.log("START FETCHING DATA ", { chainId, timestamp });
  // get markets
  const markets = await fetchSubgraphMarkets(chainId);
  // get tokens
  const tokens = getAllTokens(markets);
  const tokensByTimestamp = getTokensByTimestamp(markets, timestamp);
  // get all transfers
  const originalTransfers = await getAllTransfers(chainId);
  const futarchyTransfers = await getAllFutarchyTransfers(chainId);
  const transfers = originalTransfers
    .concat(futarchyTransfers)
    .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
  // get all liquidity events
  const liquidityEvents = chainId === gnosis.id ? [] : await getAllLiquidityEvents(chainId, tokens);
  // get prices at timestamps
  const processedPrices = await getPrices(tokens, chainId, timestamp);
  let positionSnapshots: BunniPositionSnapshot[] | PositionSnapshot[];
  let bunniGauges: string[] = [];
  if (chainId === mainnet.id) {
    const { tokens: bunniTokens, gauges } = await getBunniLpTokensByTokenPairs(chainId, tokens);
    bunniGauges = gauges;
    positionSnapshots = await getBunniPositionSnapshots(bunniTokens);
  } else {
    positionSnapshots = await getPositionSnapshotsByTokenPairs(chainId, tokens);
  }

  console.log({
    tokens: tokens.length,
    tokensByTimestamp: Object.keys(tokensByTimestamp).length,
    transfers: transfers.length,
    liquidityEvents: liquidityEvents.length,
    prices: Object.keys(processedPrices).length,
    chainId,
  });

  // START PROCESSING AIRDROP USERS
  const users: {
    [key: string]: { directHolding: number; indirectHolding: number; chainId: SupportedChain };
  } = {};
  const holdersAtTimestamp = getHoldersAtTimestamp(transfers, timestamp);
  let liquidityHoldersAtTimestamp: { [key: string]: { [key: string]: number } };
  if (chainId === gnosis.id) {
    liquidityHoldersAtTimestamp = getLiquidityBalancesByPositionAtTimestamp(
      positionSnapshots as PositionSnapshot[],
      timestamp,
    );
  } else {
    liquidityHoldersAtTimestamp = mergeTokenBalances(
      getLiquidityBalancesAtTimestamp(liquidityEvents, timestamp),
      getBunniPositionHoldersAtTimestamp(positionSnapshots as BunniPositionSnapshot[], timestamp, bunniGauges),
    );
  }
  const initialUser = {
    directHolding: 0,
    indirectHolding: 0,
    chainId,
  };
  Object.entries(holdersAtTimestamp).map(([holderAddress, tokenBalanceMapping]) => {
    if (!users[holderAddress]) {
      users[holderAddress] = { ...initialUser };
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
      users[holderAddress] = { ...initialUser };
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
  return users;
}

async function distributeAirdrop(timestamp: number) {
  // {[userAddress]:{directHolding, indirectHolding}}
  // get poh verified users
  const requestsGnosis = await getPOHVerifiedUsers(gnosis.id);
  const requestsMainnet = await getPOHVerifiedUsers(mainnet.id);
  const usersGnosis = await getSnapshotData(gnosis.id, timestamp);
  const usersMainnet = await getSnapshotData(mainnet.id, timestamp);

  const finalData = [];
  const userHoldingsAcrossChains: {
    [key: string]: { directHolding: number; indirectHolding: number; chainIds: Set<number> };
  } = {};
  let total = 0;
  let pohTotal = 0;
  for (const users of [usersGnosis, usersMainnet]) {
    for (const [holderAddress, holderData] of Object.entries(users)) {
      if (!userHoldingsAcrossChains[holderAddress]) {
        userHoldingsAcrossChains[holderAddress] = { directHolding: 0, indirectHolding: 0, chainIds: new Set() };
      }
      const totalHoldingPerUser = (holderData.directHolding ?? 0) + (holderData.indirectHolding ?? 0);
      const isPOHUser =
        isPOHVerifiedUserAtTime(requestsMainnet, holderAddress, timestamp) ||
        isPOHVerifiedUserAtTime(requestsGnosis, holderAddress, timestamp);
      total += totalHoldingPerUser;
      if (isPOHUser) {
        pohTotal += Math.sqrt(totalHoldingPerUser);
      }
      userHoldingsAcrossChains[holderAddress].directHolding += holderData.directHolding ?? 0;
      userHoldingsAcrossChains[holderAddress].indirectHolding += holderData.indirectHolding ?? 0;
      userHoldingsAcrossChains[holderAddress].chainIds.add(holderData.chainId);
    }
  }
  for (const [holderAddress, holderData] of Object.entries(userHoldingsAcrossChains)) {
    const totalHoldingPerUser = (holderData.directHolding ?? 0) + (holderData.indirectHolding ?? 0);

    if (totalHoldingPerUser.toLocaleString() !== "0") {
      const isPOHUser =
        isPOHVerifiedUserAtTime(requestsMainnet, holderAddress, timestamp) ||
        isPOHVerifiedUserAtTime(requestsGnosis, holderAddress, timestamp);
      const shareOfHolding = totalHoldingPerUser / total;
      const shareOfHoldingPoh = isPOHUser ? Math.sqrt(totalHoldingPerUser) / pohTotal : 0;
      const seerTokens = SEER_PER_DAY * (shareOfHolding * 0.25 + shareOfHoldingPoh * 0.25);
      finalData.push({
        address: holderAddress,
        isPOHUser,
        timestamp,
        totalHolding: totalHoldingPerUser,
        directHolding: holderData.directHolding ?? 0,
        indirectHolding: holderData.indirectHolding ?? 0,
        shareOfHolding,
        shareOfHoldingPoh,
        seerTokens,
        chainIds: Array.from(holderData.chainIds),
      });
    }
  }
  return finalData;
}

async function getLatestSnapshotUnixTimestamp() {
  const { data, error } = await supabase.from("airdrop_state").select("last_timestamp").eq("id", "latest_day").single();

  if (error && error.code !== "PGRST116") {
    console.error("Failed to fetch airdrop_state:", error);
    throw error;
  }

  if (!data?.last_timestamp) {
    throw "No timestamp found";
  }

  return data.last_timestamp;
}

async function addNewAirdropDayToDb() {
  try {
    const latestSnapshotUnixTimestamp = await getLatestSnapshotUnixTimestamp();
    const now = Math.floor(new Date().getTime() / 1000);
    const nextTimestamp = getRandomNextDayTimestamp(latestSnapshotUnixTimestamp, now);
    console.log({ nextTimestamp });
    if (!nextTimestamp || nextTimestamp >= now) {
      console.log("next timestamp is in the future");
      return;
    }

    const allData = await distributeAirdrop(nextTimestamp);
    //write to supabase
    const rpcPayload = {
      new_timestamp: nextTimestamp,
      records: allData.map((data) => ({
        address: data.address,
        is_poh: data.isPOHUser,
        total_holding: data.totalHolding ?? 0,
        direct_holding: data.directHolding ?? 0,
        indirect_holding: data.indirectHolding ?? 0,
        share_of_holding: data.shareOfHolding ?? 0,
        share_of_holding_poh: data.shareOfHoldingPoh ?? 0,
        seer_tokens_count: data.seerTokens ?? 0,
        chain_ids: data.chainIds,
      })),
    };

    const { error } = await supabase.rpc("insert_airdrop_safely", rpcPayload);

    if (error) {
      throw error;
    }

    console.log("Airdrop inserted safely");
  } catch (e) {
    console.log("airdrop error");
    console.log(e);
  }
}

export default async () => {
  await addNewAirdropDayToDb();
};
