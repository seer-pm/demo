import { Market, Question } from "@/hooks/useMarket";
import { MarketStatus } from "@/hooks/useMarketStatus";
import { MarketHeader } from "./MarketHeader";

const baseMarket: Market = {
  id: "0xC11712D7b3a22483a269a1B00F825E0916C5DDE4",
  marketName: "Ethereum ETF approved by May 31?",
  outcomes: ["Yes", "No"],
  outcomesSupply: 0n,
  conditionId: "0xd3c1c8744ecba93ec3a56144403d49d53624c9dee645ea37ee61a3073cab2d26",
  questionId: "0x253f7f4d66cf1024ea65a7badf48aa36821354bec09f8e73aec3f83e4935e311",
  templateId: 2n,
  lowerBound: 0n,
  upperBound: 0n,
  payoutReported: true,
  questions: [],
  encodedQuestions: [],
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

function getQuestion(marketStatus: MarketStatus) {
  const question = structuredClone(baseQuestion);

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

  return question;
}

function getMarket(marketStatus: MarketStatus, isMultiScalar = false) {
  const market = {
    ...structuredClone(baseMarket),
    questions: [getQuestion(marketStatus)],
  };

  if (marketStatus === MarketStatus.PENDING_EXECUTION) {
    // market not solved
    market.payoutReported = false;
  } else if (marketStatus === MarketStatus.CLOSED) {
    // market solved
    market.payoutReported = true;
  }

  if (isMultiScalar) {
    market.questions.push(getQuestion(MarketStatus.OPEN));
    market.questions.push(getQuestion(MarketStatus.CLOSED));
    market.outcomes = ["One", "Two", "Three"];
  }

  return market;
}

const FIXTURE: [string, MarketStatus][] = [
  ["Not Open", MarketStatus.NOT_OPEN],
  ["Open", MarketStatus.OPEN],
  ["Answer Not Final", MarketStatus.ANSWER_NOT_FINAL],
  ["In Dispute", MarketStatus.IN_DISPUTE],
  ["Pending Execution", MarketStatus.PENDING_EXECUTION],
  ["Closed", MarketStatus.CLOSED],
];

export default Object.fromEntries(
  FIXTURE.map((f) => [
    f[0],
    <div className="space-y-5">
      <MarketHeader market={getMarket(f[1])} chainId={100} />
      <div className="max-w-[500px] mx-auto">
        <MarketHeader market={getMarket(f[1])} chainId={100} isPreview={true} />
      </div>

      {f[1] === MarketStatus.ANSWER_NOT_FINAL && (
        <>
          <MarketHeader market={getMarket(f[1], true)} chainId={100} />
          <div className="max-w-[500px] mx-auto">
            <MarketHeader market={getMarket(f[1], true)} chainId={100} isPreview={true} />
          </div>
        </>
      )}
    </div>,
  ]),
);
