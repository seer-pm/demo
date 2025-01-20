import { getBlockNumber } from "@wagmi/core";
import { parseAbiItem } from "viem";
import { config as wagmiConfig, SupportedChain } from "./utils/config.ts";
import { getPublicClientForNetwork } from "./utils/common.ts";
import { SEER_SUBGRAPH_URLS } from "./utils/constants.ts";
import { createClient } from "@supabase/supabase-js";
require("dotenv").config();

const supabase = createClient(
  process.env.VITE_SUPABASE_PROJECT_URL!,
  process.env.VITE_SUPABASE_API_KEY!
);

interface NetworkContracts {
  realityETH: `0x${string}`;
  conditionalTokens: `0x${string}`;
}

const NETWORK_CONTRACTS: Record<number, NetworkContracts> = {
  // Mainnet
  1: {
    realityETH: "0x5b7dD1E86623548AF054A4985F7fc8Ccbb554E2c",
    conditionalTokens: "0xC59b0e4De5F1248C1140964E0fF287B192407E0C",
  },
  // Gnosis
  100: {
    realityETH: "0xE78996A233895bE74a66F451f1019cA9734205cc",
    conditionalTokens: "0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce",
  },
};

// ABI fragments for the events we want to listen to
const REALITY_ETH_ANSWER_EVENT = parseAbiItem(
  "event LogNewAnswer(bytes32 answer, bytes32 indexed question_id, bytes32 history_hash, address indexed user, uint256 bond, uint256 ts, bool is_commitment)"
);

const CTF_RESOLUTION_EVENT = parseAbiItem(
  "event ConditionResolution(bytes32 indexed conditionId, address indexed oracle, bytes32 indexed questionId, uint256 outcomeSlotCount, uint256[] payoutNumerators)"
);

async function fetchSubgraph(
  query: string,
  variables: Record<string, string | string[]>,
  chainId: number
) {
  const results = await fetch(SEER_SUBGRAPH_URLS[chainId]!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });
  return await results.json();
}

async function getMarketsForQuestionId(
  questionIds: string[],
  networkId: SupportedChain
): Promise<Map<string, string[]>> {
  const result = (
    await Promise.all([
      getExistingConditionalTokensQuestionIds(questionIds, networkId),
      getExistingRealityQuestionIds(questionIds, networkId),
    ])
  ).flat();

  const questionIdToMarketIds = new Map<string, string[]>();

  for (const { questionId, marketIds } of result) {
    const existingMarketIds = questionIdToMarketIds.get(questionId) || [];
    existingMarketIds.push(...marketIds);
    questionIdToMarketIds.set(questionId, existingMarketIds);
  }

  return questionIdToMarketIds;
}

type QuestionAndMarkets = { questionId: string; marketIds: string[] }[];

async function getExistingConditionalTokensQuestionIds(
  questionIds: string[],
  networkId: SupportedChain
): Promise<QuestionAndMarkets> {
  const query = `
    query CheckQuestions($questionIds: [Bytes!]!) {
      markets(where: { questionId_in: $questionIds }) {
        id
        questionId
      }
    }
  `;

  const { data } = await fetchSubgraph(query, { questionIds }, networkId);

  return data.markets.map(
    ({ id, questionId }: { id: string; questionId: string }) => ({
      questionId,
      marketIds: [id],
    })
  );
}

async function getExistingRealityQuestionIds(
  questionIds: string[],
  networkId: SupportedChain
): Promise<QuestionAndMarkets> {
  const query = `
    query CheckQuestions($questionIds: [Bytes!]!) {
      questions(where: { id_in: $questionIds }) {
        id
        marketQuestions {
          market {
            id
          }
        }
      }
    }
  `;

  const { data } = await fetchSubgraph(query, { questionIds }, networkId);

  return data.questions.map(
    (res: { id: string; marketQuestions: { market: { id: string } }[] }) => ({
      questionId: res.id,
      marketIds: res.marketQuestions.map((mq) => mq.market.id),
    })
  );
}

interface NotificationQueueItem {
  event_id: string;
  email: string;
}

async function getUsersEmailsByMarket(
  marketIds: string[]
): Promise<Map<string, string[]>> {
  try {
    // Get users who favorited these markets and have verified emails
    const { data: favoriteData, error } = await supabase
      .from("collections_markets")
      .select(
        `
        market_id,
        users!inner (
          email
        )
      `
      )
      .in("market_id", marketIds)
      .is("collection_id", null)
      .eq("users.email_verified", true);

    if (error) {
      throw error;
    }

    // Create a map of market_id to array of user emails
    const marketToEmails = new Map<string, string[]>();

    favoriteData.forEach((favorite) => {
      const emails = marketToEmails.get(favorite.market_id) || [];
      emails.push(favorite.users.email);
      marketToEmails.set(favorite.market_id, emails);
    });

    return marketToEmails;
  } catch (error) {
    console.error("Error fetching users emails by market:", error);
    throw error;
  }
}

type EventType = "answer" | "resolution";

async function processEvent(
  questionId: string,
  marketIds: string[],
  networkId: SupportedChain,
  eventType: EventType,
  marketToEmails: Map<string, string[]>,
  log: { transactionHash: string; blockNumber: bigint; logIndex: number },
  marketNames: Map<string, string>
) {
  try {
    // Create notifications for each market and its users
    const notifications: NotificationQueueItem[] = [];

    for (const marketId of marketIds) {
      const emails = marketToEmails.get(marketId) || [];
      const marketName = marketNames.get(marketId) || "";
      notifications.push(
        ...emails.map((email) => ({
          event_id: `${networkId}-${log.transactionHash}-${log.logIndex}-${eventType}-${email}`,
          email,
          data: getNotificationData(marketId, marketName, networkId, eventType),
        }))
      );
    }

    if (notifications.length === 0) {
      //console.log(`No users to notify for ${eventType} event on question ${questionId}`);
      return;
    }

    const { error } = await supabase
      .from("notifications_queue")
      .upsert(notifications, {
        onConflict: "event_id",
      });

    if (error) {
      throw error;
    }

    console.log(
      `Stored ${
        notifications.length
      } notifications - ${eventType} event for question ${questionId} on chain ${networkId} with markets ${marketIds.join(
        ", "
      )}`
    );
  } catch (error) {
    console.error("Error storing notifications:", error);
    throw error;
  }
}

function getNotificationData(
  marketId: string,
  marketName: string,
  networkId: number,
  eventType: EventType
): any {
  const title = {
    answer: `The market "${marketName}" has a new answer`,
    resolution: `The market "${marketName}" has been resolved`,
  }[eventType];

  const subject = {
    answer: "New answer submitted for a market you follow",
    resolution: "A market you follow has been resolved",
  }[eventType];

  return {
    TemplateAlias: "market-update",
    TemplateModel: {
      title,
      market_url: `https://app.seer.pm/markets/${networkId}/${marketId}`,
      subject,
    },
  };
}

async function getAnswerEvents(networkId: SupportedChain, fromBlock: bigint) {
  try {
    // Listen for Reality.eth answer submissions
    const answerLogs = await getPublicClientForNetwork(networkId).getLogs({
      address: NETWORK_CONTRACTS[networkId].realityETH,
      event: REALITY_ETH_ANSWER_EVENT,
      fromBlock,
      toBlock: "latest",
    });

    console.log(
      `[Network ${networkId}] Found ${answerLogs.length} answer events`
    );
    return answerLogs;
  } catch (error) {
    console.error(
      `[Network ${networkId}] Error fetching answer events:`,
      error
    );
    throw error;
  }
}

async function getResolutionEvents(
  networkId: SupportedChain,
  fromBlock: bigint
) {
  try {
    // Listen for ConditionalTokens resolutions
    const resolutionLogs = await getPublicClientForNetwork(networkId).getLogs({
      address: NETWORK_CONTRACTS[networkId].conditionalTokens,
      event: CTF_RESOLUTION_EVENT,
      fromBlock,
      toBlock: "latest",
    });

    console.log(
      `[Network ${networkId}] Found ${resolutionLogs.length} resolution events`
    );
    return resolutionLogs;
  } catch (error) {
    console.error(
      `[Network ${networkId}] Error fetching resolution events:`,
      error
    );
    throw error;
  }
}

function getLastProcessedBlockKey(networkId: SupportedChain): string {
  return `notifications-events-${networkId}-last-block`;
}

async function getLastProcessedBlock(
  networkId: SupportedChain
): Promise<bigint> {
  const key = getLastProcessedBlockKey(networkId);

  const { data, error } = await supabase
    .from("key_value")
    .select("value")
    .eq("key", key)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      // Only throw if it's not a "not found" error
      throw error;
    }

    // default to current block - 100
    const currentBlock = await getBlockNumber(wagmiConfig, {
      chainId: networkId,
    });
    return currentBlock - 100n;
  }

  return BigInt(data.value.blockNumber);
}

async function updateLastProcessedBlock(
  networkId: SupportedChain,
  blockNumber: bigint
) {
  const key = getLastProcessedBlockKey(networkId);

  try {
    const { error } = await supabase.from("key_value").upsert(
      {
        key,
        value: { blockNumber: blockNumber.toString() },
      },
      { onConflict: "key" }
    );

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(
      `Error updating last processed block for network ${networkId}:`,
      error
    );
    throw error;
  }
}

async function getMarketNamesByMarket(
  marketIds: string[],
  networkId: SupportedChain
): Promise<Map<string, string>> {
  const query = `
    query GetMarketNames($marketIds: [ID!]!) {
      markets(where: { id_in: $marketIds }) {
        id
        marketName
      }
    }
  `;

  const { data } = await fetchSubgraph(query, { marketIds }, networkId);

  const marketNames = new Map<string, string>();
  data.markets.forEach((market: { id: string; marketName: string }) => {
    marketNames.set(market.id, market.marketName);
  });

  return marketNames;
}

async function processNetworkEvents(networkId: SupportedChain) {
  const fromBlock = await getLastProcessedBlock(networkId);

  const currentBlock = await getBlockNumber(wagmiConfig, {
    chainId: networkId,
  });

  await updateLastProcessedBlock(networkId, currentBlock);

  // Fetch all events
  const [answerLogs, resolutionLogs] = await Promise.all([
    getAnswerEvents(networkId, fromBlock),
    getResolutionEvents(networkId, fromBlock),
  ]);

  // Extract all questionIds from both types of events
  const questionIds = [
    ...answerLogs.map((log) => log.args.question_id as string),
    ...resolutionLogs.map((log) => log.args.questionId as string),
  ];

  if (questionIds.length === 0) {
    console.log(`[Network ${networkId}] No events found`);
    return;
  }

  const marketsForQuestionId = await getMarketsForQuestionId(
    questionIds,
    networkId
  );

  if (marketsForQuestionId.size === 0) {
    console.log(`[Network ${networkId}] No seer events found`);
    return;
  }

  // Get all unique market IDs
  const allMarketIds = Array.from(marketsForQuestionId.values()).flat();

  // Get emails and market names for all markets at once
  const [marketToEmails, marketNames] = await Promise.all([
    getUsersEmailsByMarket(allMarketIds),
    getMarketNamesByMarket(allMarketIds, networkId),
  ]);

  for (const log of answerLogs) {
    const questionId = log.args.question_id as string;
    if (marketsForQuestionId.has(questionId)) {
      await processEvent(
        questionId,
        marketsForQuestionId.get(questionId) || [],
        networkId,
        "answer",
        marketToEmails,
        log,
        marketNames
      );
    }
  }

  for (const log of resolutionLogs) {
    const questionId = log.args.questionId as string;
    if (marketsForQuestionId.has(questionId)) {
      await processEvent(
        questionId,
        marketsForQuestionId.get(questionId) || [],
        networkId,
        "resolution",
        marketToEmails,
        log,
        marketNames
      );
    }
  }

  console.log(`[Network ${networkId}] Finished processing events`);
}

export default async () => {
  try {
    await Promise.all(
      Object.keys(NETWORK_CONTRACTS).map((networkId) =>
        processNetworkEvents(Number(networkId) as SupportedChain)
      )
    );
  } catch (e) {
    console.error("Error in notification events loader:", e);
  }
};

export const config = {
  schedule: "*/10 * * * *",
};
