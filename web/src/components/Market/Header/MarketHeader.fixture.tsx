import { Market, Question } from "@/hooks/useMarket";
import { MarketStatus } from "@/hooks/useMarketStatus";
import { SupportedChain, gnosis } from "@/lib/chains";
import { ANSWERED_TOO_SOON, REALITY_TEMPLATE_UINT } from "@/lib/reality";
import { zeroAddress } from "viem";
import { MarketHeader } from "./MarketHeader";

const baseMarket: Market = {
  id: "0xC11712D7b3a22483a269a1B00F825E0916C5DDE4",
  type: "Generic",
  collateralToken: zeroAddress,
  collateralToken1: zeroAddress,
  collateralToken2: zeroAddress,
  chainId: 1,
  marketName: "Ethereum ETF approved by May 31?",
  outcomes: ["Yes", "No"],
  wrappedTokens: ["0x000", "0x000"],
  parentMarket: {
    id: "0x000",
    conditionId: "0x000",
    payoutReported: false,
    payoutNumerators: [0n, 0n],
  },
  parentOutcome: 0n,
  outcomesSupply: 0n,
  liquidityUSD: 0,
  incentive: 0,
  hasLiquidity: false,
  parentCollectionId: "0x000",
  conditionId: "0x000",
  questionId: "0x253f7f4d66cf1024ea65a7badf48aa36821354bec09f8e73aec3f83e4935e311",
  templateId: 2n,
  lowerBound: 0n,
  upperBound: 0n,
  payoutReported: true,
  payoutNumerators: [0n, 0n],
  questions: [],
  openingTs: 0,
  encodedQuestions: [],
  categories: ["misc"],
  poolBalance: [],
  odds: [],
};

const baseQuestion: Question = {
  id: "0x000" as `0x${string}`,
  arbitrator: "0xe40DD83a262da3f56976038F1554Fe541Fa75ecd",
  opening_ts: 1717192800,
  timeout: 129600,
  finalize_ts: 0,
  is_pending_arbitration: false,
  best_answer: "0x0000000000000000000000000000000000000000000000000000000000000000",
  bond: 0n,
  min_bond: 100000000000000000n,
};

let questionIdCounter = 1;
function getQuestion(marketStatus: MarketStatus, bestAnswer: `0x${string}` | "" = "") {
  const question = structuredClone(baseQuestion);

  question.id = `${question.id}${questionIdCounter++}`;

  if (marketStatus === MarketStatus.NOT_OPEN) {
    // opening_ts in the future
    question.opening_ts = Math.round(new Date().getTime() / 1000) + 60 * 60;
  } else if (marketStatus === MarketStatus.OPEN) {
    // opening_ts in the past
    question.opening_ts = Math.round(new Date().getTime() / 1000) - 60 * 60;
  } else if (marketStatus === MarketStatus.ANSWER_NOT_FINAL) {
    // opening_ts in the past, finalize_ts in the future
    question.opening_ts = Math.round(new Date().getTime() / 1000) - 60 * 60;
    question.finalize_ts = Math.round(new Date().getTime() / 1000) + 60 * 60 * 2;
  } else if (marketStatus === MarketStatus.IN_DISPUTE) {
    // opening_ts in the past, finalize_ts in the future, question pending arbitration
    question.opening_ts = Math.round(new Date().getTime() / 1000) - 60 * 60;
    question.finalize_ts = Math.round(new Date().getTime() / 1000) + 60 * 60 * 2;
    question.is_pending_arbitration = true;
  } else if (marketStatus === MarketStatus.PENDING_EXECUTION) {
    // opening_ts in the past, finalize_ts in the past, market not solved
    question.opening_ts = Math.round(new Date().getTime() / 1000) - 60 * 60;
    question.finalize_ts = Math.round(new Date().getTime() / 1000) - 60 * 30;
  } else if (marketStatus === MarketStatus.CLOSED) {
    // opening_ts in the past, finalize_ts in the past, market solved
    question.opening_ts = Math.round(new Date().getTime() / 1000) - 60 * 60;
    question.finalize_ts = Math.round(new Date().getTime() / 1000) - 60 * 30;
  }

  if (bestAnswer !== "") {
    question.best_answer = bestAnswer;
  }

  return question;
}

function getMarket(
  marketStatus: MarketStatus | "PENDING_EXECUTION_TOO_SOON",
  isMultiScalar: boolean,
  chainId: SupportedChain,
) {
  const market = {
    ...structuredClone(baseMarket),
    chainId,
    questions: [
      marketStatus === "PENDING_EXECUTION_TOO_SOON"
        ? getQuestion(MarketStatus.PENDING_EXECUTION, isMultiScalar ? "" : ANSWERED_TOO_SOON)
        : getQuestion(marketStatus),
    ],
  };

  if (marketStatus === MarketStatus.PENDING_EXECUTION || marketStatus === "PENDING_EXECUTION_TOO_SOON") {
    // market not solved
    market.payoutReported = false;
  } else if (marketStatus === MarketStatus.CLOSED) {
    // market solved
    market.payoutReported = true;
  }

  if (isMultiScalar) {
    if (marketStatus === MarketStatus.NOT_OPEN) {
      market.questions.push(getQuestion(MarketStatus.NOT_OPEN));
      market.questions.push(getQuestion(MarketStatus.NOT_OPEN));
    } else if (marketStatus === MarketStatus.OPEN) {
      market.questions.push(getQuestion(MarketStatus.OPEN));
      market.questions.push(getQuestion(MarketStatus.OPEN));
    } else if (marketStatus === MarketStatus.ANSWER_NOT_FINAL) {
      market.questions.push(getQuestion(MarketStatus.ANSWER_NOT_FINAL));
      market.questions.push(getQuestion(MarketStatus.OPEN));
    } else if (marketStatus === MarketStatus.IN_DISPUTE) {
      market.questions.push(getQuestion(MarketStatus.CLOSED));
      market.questions.push(getQuestion(MarketStatus.ANSWER_NOT_FINAL));
    } else if (marketStatus === MarketStatus.PENDING_EXECUTION) {
      market.questions.push(getQuestion(MarketStatus.PENDING_EXECUTION));
      market.questions.push(getQuestion(MarketStatus.PENDING_EXECUTION));
    } else if (marketStatus === "PENDING_EXECUTION_TOO_SOON") {
      market.questions.push(getQuestion(MarketStatus.PENDING_EXECUTION, ANSWERED_TOO_SOON));
      market.questions.push(getQuestion(MarketStatus.PENDING_EXECUTION));
    } else if (marketStatus === MarketStatus.CLOSED) {
      market.questions.push(getQuestion(MarketStatus.CLOSED));
      market.questions.push(getQuestion(MarketStatus.CLOSED));
    }
    market.marketName = "How many votes will each party get at the 2024 elections?";
    market.outcomes = ["Party 1", "Party 2", "Party 3"];
    market.templateId = BigInt(REALITY_TEMPLATE_UINT);
  }

  return market;
}

const FIXTURE: [string, MarketStatus | "PENDING_EXECUTION_TOO_SOON"][] = [
  ["Not Open", MarketStatus.NOT_OPEN],
  ["Open", MarketStatus.OPEN],
  ["Answer Not Final", MarketStatus.ANSWER_NOT_FINAL],
  ["In Dispute", MarketStatus.IN_DISPUTE],
  ["Pending Execution", MarketStatus.PENDING_EXECUTION],
  ["Pending Execution + Answered Too Soon", "PENDING_EXECUTION_TOO_SOON"],
  ["Closed", MarketStatus.CLOSED],
];

export default Object.fromEntries(
  FIXTURE.map((f) => [
    f[0],
    <div className="space-y-5" key={f[0]}>
      <MarketHeader market={getMarket(f[1], false, gnosis.id)} />
      <div className="max-w-[500px] mx-auto">
        <MarketHeader market={getMarket(f[1], false, gnosis.id)} type="preview" />
      </div>

      <MarketHeader market={getMarket(f[1], true, gnosis.id)} />
      <div className="max-w-[500px] mx-auto">
        <MarketHeader market={getMarket(f[1], true, gnosis.id)} type="preview" />
      </div>
    </div>,
  ]),
);
