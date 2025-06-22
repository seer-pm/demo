import { realityAddress } from "@/hooks/contracts/generated-reality";
import { SupportedChain, sepolia } from "@/lib/chains.ts";
import { Question } from "@/lib/market";
import { decodeQuestion, getAnswerText, getRealityLink } from "@/lib/reality.ts";
import { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { getBlockNumber } from "@wagmi/core";
import { parseAbiItem } from "viem";
import { getPublicClientForNetwork } from "./utils/common.ts";
import { chainIds, config as wagmiConfig } from "./utils/config.ts";
import { getLastProcessedBlock, updateLastProcessedBlock } from "./utils/logs.ts";

const SEER_NOTIFICATIONS_CHANNEL = "-1002545711308";

const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

async function sendTelegramMessage(botToken: string, chatId: string, message: string) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    }),
  });

  if (response.ok) {
    return await response.json();
  }

  throw new Error(`Failed to send Telegram message: ${response.status} ${response.statusText}`);
}

async function getMarketsFromQuestions(questionIdToAnswerMap: Record<string, string>) {
  try {
    const { data, error } = await supabase
      .from("markets")
      .select("id, url, subgraph_data")
      .not("subgraph_data->questions", "is", null);

    if (error) {
      console.error("Error fetching markets from Supabase:", error);
      return new Map();
    }

    const questionToMarketMap = new Map<
      `0x${string}`,
      {
        marketId: string;
        url: string;
        encodedQuestion: string;
        question: Question;
        answer: string;
        outcomes: string[];
        templateId: string;
      }
    >();

    for (const market of data) {
      const questions = (market.subgraph_data?.questions || []) as { question: Question }[];
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        if (question?.question?.id && questionIdToAnswerMap[question.question.id]) {
          questionToMarketMap.set(question.question.id as `0x${string}`, {
            marketId: market.id,
            url: market.url,
            encodedQuestion: market.subgraph_data.encodedQuestions[i],
            question: question.question,
            answer: questionIdToAnswerMap[question.question.id],
            outcomes: market.subgraph_data.outcomes,
            templateId: market.subgraph_data.templateId,
          });
        }
      }
    }

    return questionToMarketMap;
  } catch (error) {
    console.error("Error processing market data:", error);
    return new Map();
  }
}

const REALITY_LOG_NEW_ANSWER_EVENT = parseAbiItem(
  "event LogNewAnswer( bytes32 answer, bytes32 indexed question_id, bytes32 history_hash, address indexed user, uint256 bond, uint256 ts, bool is_commitment)",
);
// const REALITY_LOG_NOTIFY_OF_ARBITRATION_REQUEST = parseAbiItem(
//   "event LogNotifyOfArbitrationRequest( bytes32 indexed question_id, address indexed user)"
// );

async function getNewAnswerEvents(chainId: SupportedChain, fromBlock: bigint) {
  // Listen for RealityETH LogNewAnswer events
  console.log(`[Network ${chainId}] Searching new answer events from block ${fromBlock.toString()}`);
  const newAnswerLogs = await getPublicClientForNetwork(chainId).getLogs({
    address: realityAddress[chainId],
    event: REALITY_LOG_NEW_ANSWER_EVENT,
    fromBlock,
    toBlock: "latest",
  });

  console.log(`[Network ${chainId}] Found ${newAnswerLogs.length} new answer events`);

  const questionIdToAnswerMap = newAnswerLogs.reduce(
    (acc, { args }) => {
      acc[args.question_id!] = args.answer!;
      return acc;
    },
    {} as Record<string, string>,
  );

  const questionToMarketMap = await getMarketsFromQuestions(questionIdToAnswerMap);
  console.log(`[Network ${chainId}] Filtered down to ${questionToMarketMap.size} market-related question events`);

  return [...questionToMarketMap.values()];
}

function getLastProcessedBlockKey(chainId: SupportedChain): string {
  return `reality-new-answer-events-${chainId}-last-block`;
}

async function processChain(chainId: SupportedChain, botToken: string) {
  const fromBlock = await getLastProcessedBlock(chainId, getLastProcessedBlockKey(chainId));

  try {
    const newAnswers = await getNewAnswerEvents(chainId, fromBlock);

    if (newAnswers.length > 0) {
      const messages = newAnswers.map((data) => {
        const decodedQuestion = decodeQuestion(data.encodedQuestion);
        const question = data.question;
        question.best_answer = data.answer;

        return `Question: ${decodedQuestion.question}\n
Answer: ${getAnswerText(question, data.outcomes, Number(data.templateId))}\n
<a href="${getRealityLink(chainId, data.question.id)}">Check on Reality</a>\n
<a href="https://app.seer.pm/markets/${chainId}/${data.url}">Check on Seer</a>`;
      });

      // Send messages with a 2-second delay between each one
      for (const message of messages) {
        await sendTelegramMessage(botToken, SEER_NOTIFICATIONS_CHANNEL, message);

        // Wait for 2 seconds before sending the next message
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  } catch (error) {
    console.error(`[Network ${chainId}] Error fetching answer events:`, error);
  }

  // Update the last processed block even if this execution failed
  // This is because RPCs only allow reading a fixed number of blocks
  // So there's no point in trying to read from an old block that may fail
  const currentBlock = await getBlockNumber(wagmiConfig, {
    chainId,
  });
  await updateLastProcessedBlock(chainId, currentBlock, getLastProcessedBlockKey(chainId));
}

export default async () => {
  if (!process.env.TELEGRAM_NOTIFICATIONS_BOT_TOKEN) {
    console.log("Missing TELEGRAM_NOTIFICATIONS_BOT_TOKEN variable");
    return;
  }

  for (const chainId of chainIds) {
    if (chainId === sepolia.id) {
      // ignore testnets
      continue;
    }
    try {
      await processChain(chainId, process.env.TELEGRAM_NOTIFICATIONS_BOT_TOKEN);
    } catch (e) {
      console.log(e);
    }
  }
};

export const config: Config = {
  schedule: "*/10 * * * *",
};
