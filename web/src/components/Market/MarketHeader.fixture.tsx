import { Market } from "@/hooks/useMarket";
import { MarketStatus } from "@/hooks/useMarketStatus";
import { MarketHeader } from "./MarketHeader";

const baseMarket: Market = {
  id: "0xC11712D7b3a22483a269a1B00F825E0916C5DDE4",
  marketName: "Ethereum ETF approved by May 31?",
  outcomes: ["Yes", "No"],
  conditionId: "0xd3c1c8744ecba93ec3a56144403d49d53624c9dee645ea37ee61a3073cab2d26",
  questionId: "0x253f7f4d66cf1024ea65a7badf48aa36821354bec09f8e73aec3f83e4935e311",
  templateId: 2n,
  lowerBound: 0n,
  upperBound: 0n,
  payoutReported: true,
  questions: [
    {
      content_hash: "0xfd6032d057b3d122455d310c1f6556650456b045ecf38c5b767f7e75818b22aa",
      arbitrator: "0xe40DD83a262da3f56976038F1554Fe541Fa75ecd",
      opening_ts: 1717192800,
      timeout: 129600,
      finalize_ts: 0,
      is_pending_arbitration: false,
      bounty: 0n,
      best_answer: "0x0000000000000000000000000000000000000000000000000000000000000000",
      history_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      bond: 0n,
      min_bond: 100000000000000000n,
    },
  ],
};

function getMarket(marketStatus: MarketStatus) {
  const market = structuredClone(baseMarket);

  if (marketStatus === MarketStatus.NOT_OPEN) {
    // opening_ts in the future
    market.questions[0].opening_ts = Math.round(new Date().getTime() / 1000) + 60 * 60;
  } else if (marketStatus === MarketStatus.OPEN) {
    // opening_ts in the past
    market.questions[0].opening_ts = Math.round(new Date().getTime() / 1000) - 60 * 60;
  } else if (marketStatus === MarketStatus.ANSWER_NOT_FINAL) {
    // opening_ts in the past, finalize_ts in the future
    market.questions[0].opening_ts = Math.round(new Date().getTime() / 1000) - 60 * 60;
    market.questions[0].finalize_ts = Math.round(new Date().getTime() / 1000) + 60 * 60 * 2;
  } else if (marketStatus === MarketStatus.PENDING_EXECUTION) {
    // opening_ts in the past, finalize_ts in the past, market not solved
    market.questions[0].opening_ts = Math.round(new Date().getTime() / 1000) - 60 * 60;
    market.questions[0].finalize_ts = Math.round(new Date().getTime() / 1000) - 60 * 30;
    market.payoutReported = false;
  } else if (marketStatus === MarketStatus.CLOSED) {
    // opening_ts in the past, finalize_ts in the past, market solved
    market.questions[0].opening_ts = Math.round(new Date().getTime() / 1000) - 60 * 60;
    market.questions[0].finalize_ts = Math.round(new Date().getTime() / 1000) - 60 * 30;
    market.payoutReported = true;
  }

  return market;
}

const FIXTURE: [string, MarketStatus][] = [
  ["Not Open", MarketStatus.NOT_OPEN],
  ["Open", MarketStatus.OPEN],
  ["Answer Not Final", MarketStatus.ANSWER_NOT_FINAL],
  ["Pending Execution", MarketStatus.PENDING_EXECUTION],
  ["Closed", MarketStatus.CLOSED],
];

export default Object.fromEntries(
  FIXTURE.map((f) => [
    f[0],
    <div className="space-y-5">
      <MarketHeader market={getMarket(f[1])} chainId={100} />
      <div className="max-w-[500px] mx-auto">
        <MarketHeader market={getMarket(f[1])} chainId={100} showOutcomes={true} />
      </div>
    </div>,
  ]),
);
