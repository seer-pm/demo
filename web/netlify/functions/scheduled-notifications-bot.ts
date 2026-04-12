import { sepolia } from "@/lib/chains.ts";
import type { Config } from "@netlify/functions";
import type { Question, SupportedChain } from "@seer-pm/sdk";
import { realityAddress } from "@seer-pm/sdk/contracts/reality";
import { decodeQuestion, getAnswerText, getRealityLink, isScalarBoundInWei } from "@seer-pm/sdk/reality";
import { createClient } from "@supabase/supabase-js";
import { parseAbiItem } from "viem";
import { getBlockNumber, getLogs } from "viem/actions";
import { chainIds, getPublicClientByChainId } from "./utils/config.ts";
import { getLastProcessedBlock, updateLastProcessedBlock } from "./utils/logs.ts";

const SEER_NOTIFICATIONS_CHANNEL = "-1002545711308";
const SEER_HIGH_LIQUIDITY_NOTIFICATIONS_CHANNEL = "-1003951302263";
const HIGH_LIQUIDITY_NOTIFICATION_THRESHOLD = 500;

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

type MarketFromQuestion = {
  maxLiquidity: number;
  url: string;
  encodedQuestion: string;
  question: Question;
  answer: `0x${string}`;
  outcomes: string[];
  templateId: string;
};

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

async function getMarketsFromQuestions(
  questionIdToAnswerMap: Record<`0x${string}`, `0x${string}`>,
): Promise<Map<`0x${string}`, MarketFromQuestion>> {
  try {
    const questionIds = Object.keys(questionIdToAnswerMap);
    if (questionIds.length === 0) {
      return new Map();
    }

    const { data, error } = await supabase.rpc("markets_by_question_ids", { ids: questionIds });

    if (error) {
      console.error("Error fetching markets from Supabase:", error);
      return new Map();
    }

    const questionToMarketMap = new Map<`0x${string}`, MarketFromQuestion>();

    for (const market of data) {
      const upperBound = BigInt(market.subgraph_data?.upperBound || 0);
      if (upperBound > 0n && !isScalarBoundInWei(upperBound)) {
        // ignore legacy markets
        continue;
      }
      const questions = (market.subgraph_data?.questions || []) as { question: Question }[];
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        if (question?.question?.id && questionIdToAnswerMap[question.question.id]) {
          questionToMarketMap.set(question.question.id, {
            maxLiquidity: market.max_liquidity ?? 0,
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
  const newAnswerLogs = await getLogs(getPublicClientByChainId(chainId), {
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
    {} as Record<`0x${string}`, `0x${string}`>,
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

      // Send messages in batches of 20, with a 1.5-second delay between batches
      for (let i = 0; i < messages.length; i++) {
        await sendTelegramMessage(botToken, SEER_NOTIFICATIONS_CHANNEL, messages[i]);

        const maxLiq = newAnswers[i].maxLiquidity;
        if (SEER_HIGH_LIQUIDITY_NOTIFICATIONS_CHANNEL && maxLiq > HIGH_LIQUIDITY_NOTIFICATION_THRESHOLD) {
          console.log(
            `[Network ${chainId}] Sending high liquidity notification (maxLiquidity: ${maxLiq}) for market: https://app.seer.pm/markets/${chainId}/${newAnswers[i].url}`,
          );
          await sendTelegramMessage(botToken, SEER_HIGH_LIQUIDITY_NOTIFICATIONS_CHANNEL, messages[i]);
        }

        // Wait for 1.5 seconds after every 20 messages (but not after the last message)
        if ((i + 1) % 20 === 0 && i + 1 < messages.length) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
    }
  } catch (error) {
    console.error(`[Network ${chainId}] Error fetching answer events:`, error);
  }

  // Update the last processed block even if this execution failed
  // This is because RPCs only allow reading a fixed number of blocks
  // So there's no point in trying to read from an old block that may fail
  const currentBlock = await getBlockNumber(getPublicClientByChainId(chainId));
  await updateLastProcessedBlock(chainId, currentBlock, getLastProcessedBlockKey(chainId));
}

export default async () => {
  if (!process.env.TELEGRAM_NOTIFICATIONS_BOT_TOKEN) {
    console.log("Missing TELEGRAM_NOTIFICATIONS_BOT_TOKEN variable");
    return;
  }

  console.log("Initializing notification cycle...");

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
