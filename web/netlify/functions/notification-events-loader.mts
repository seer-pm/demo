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

// TODO: add all the required fields, create ID based on tx hash to avoid duplications?
interface NotificationQueueItem {
  email: string;
}

async function getUsersEmailsByMarket(
  marketIds: string[]
): Promise<Map<string, string[]>> {
  try {
    // Get users who favorited these markets and their emails in a single query
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
      .is("collection_id", null);

    if (error) {
      throw error;
    }

    // Create a map of market_id to array of user emails
    const marketToEmails = new Map<string, string[]>();

    favoriteData.forEach(
      (favorite: { market_id: string; users: { email: string } }) => {
        const emails = marketToEmails.get(favorite.market_id) || [];
        emails.push(favorite.users.email);
        marketToEmails.set(favorite.market_id, emails);
      }
    );

    return marketToEmails;
  } catch (error) {
    console.error("Error fetching users emails by market:", error);
    throw error;
  }
}

async function processEvent(
  questionId: string,
  marketIds: string[],
  networkId: SupportedChain,
  eventType: "answer" | "resolution",
  marketToEmails: Map<string, string[]>
) {
  try {
    // Create notifications for each market and its users
    const notifications: NotificationQueueItem[] = [];

    for (const marketId of marketIds) {
      const emails = marketToEmails.get(marketId) || [];
      notifications.push(...emails.map((email) => ({ email })));
    }

    if (notifications.length === 0) {
      //console.log(`No users to notify for ${eventType} event on question ${questionId}`);
      return;
    }

    const { error } = await supabase
      .from("notifications_queue")
      .insert(notifications);

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

async function getInitialBlock(networkId: SupportedChain) {
  // TODO: read latest processed block
  // const currentBlock = await getBlockNumber(wagmiConfig, {chainId: networkId});
  return networkId === 100 ? 37266169n : 21430618n;
}

async function processNetworkEvents(networkId: SupportedChain) {
  const fromBlock = await getInitialBlock(networkId);

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

  // Get emails for all markets at once
  const marketToEmails = await getUsersEmailsByMarket(allMarketIds);

  for (const log of answerLogs) {
    const questionId = log.args.question_id as string;
    if (marketsForQuestionId.has(questionId)) {
      await processEvent(
        questionId,
        marketsForQuestionId.get(questionId) || [],
        networkId,
        "answer",
        marketToEmails
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
        marketToEmails
      );
    }
  }

  console.log(`[Network ${networkId}] Finished processing events`);
}

export const handler = async () => {
  try {
    await Promise.all(
      Object.keys(NETWORK_CONTRACTS).map((networkId) =>
        processNetworkEvents(Number(networkId) as SupportedChain)
      )
    );

    return { statusCode: 200 };
  } catch (e) {
    console.error("Error in notification events loader:", e);
    return { statusCode: 501 };
  }
};

export const config = {
  schedule: "*/10 * * * *",
};
