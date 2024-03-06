import { Market } from "@/hooks/useMarket";
import { MarketStatus, useMarketStatus } from "@/hooks/useMarketStatus";
import { useResolveMarket } from "@/hooks/useResolveMarket";
import { SupportedChain } from "@/lib/chains";
import { CalendarIcon, CategoryIcon, CheckCircleIcon, DaiLogo } from "@/lib/icons";
import { getClosingTime } from "@/lib/market";
import { getAnswerText, getCurrentBond } from "@/lib/reality";
import { displayBalance } from "@/lib/utils";
import { TransactionReceipt } from "viem";
import Button from "../Form/Button";
import { AnswerForm, AnswerFormLink } from "./AnswerForm";

interface MarketHeaderProps {
  market: Market;
  chainId: SupportedChain;
}

function MarketInfo({ market, marketStatus }: { market: Market; marketStatus: MarketStatus }) {
  const resolveMarket = useResolveMarket((_receipt: TransactionReceipt) => {
    alert("Market resolved!");
  });

  const resolveHandler = async () => {
    resolveMarket.mutateAsync({
      marketId: market.id,
    });
  };

  if (marketStatus === MarketStatus.OPEN) {
    return (
      <div className="flex items-center space-x-2">
        <CalendarIcon /> <div>Closes on {getClosingTime(market)}</div>
      </div>
    );
  }

  if (marketStatus === MarketStatus.CLOSED) {
    return (
      <div>
        Market closed.{" "}
        {market.questions.length === 1 &&
          `Result: ${getAnswerText(market.questions[0], market.outcomes, market.templateId)}`}
      </div>
    );
  }

  if (marketStatus === MarketStatus.WAITING_PAYOUT_REPORT) {
    return (
      <div className="space-y-3">
        <div>Anyone can resolve the market to be able to redeem the prizes.</div>
        <Button className="btn btn-primary btn-xs" text="Resolve market" onClick={resolveHandler} />
      </div>
    );
  }

  if (marketStatus === MarketStatus.WAITING_RESULTS) {
    if (market.questions.length > 1) {
      // multi scalar market
      return "This market is not resolved yet.";
    }

    return (
      <div>
        <div>
          This market is not resolved yet. You can provide an answer below, depositing a bond of{" "}
          {displayBalance(getCurrentBond(market.questions[0].bond, market.questions[0].min_bond), 18)} DAI.
        </div>
        <div>
          Current answer: {getAnswerText(market.questions[0], market.outcomes, market.templateId)}.
          {market.questions[0].finalize_ts > 0 && (
            <>Closes on {new Date(market.questions[0].finalize_ts * 1000).toUTCString()}</>
          )}
        </div>
        <div>
          <AnswerFormLink market={market} />
          <AnswerForm market={market} />
        </div>
      </div>
    );
  }

  return null;
}

export function MarketHeader({ market, chainId }: MarketHeaderProps) {
  const { data: marketStatus } = useMarketStatus(market, chainId);

  return (
    <div className="bg-white rounded-[3px] drop-shadow">
      <div className="flex justify-between bg-[#FBFBFB] border-t border-t-[5px] border-t-[#999999] text-[14px] text-[#999999] px-[25px] h-[45px] items-center">
        <div className="flex items-center space-x-2">
          <div className="w-[8px] h-[8px] rounded-full bg-[#999999]"></div>

          <div>Market not open yet</div>
        </div>
        <div>#57</div>
      </div>
      <div className="flex space-x-3 p-[24px]">
        <div>
          <div className="w-[70px] h-[70px] rounded-full bg-primary"></div>
        </div>
        <div>
          <div className="text-[24px] font-semibold">{market.marketName}</div>
          <div className="text-[14px] text-[#999999]">
            {market && marketStatus && <MarketInfo market={market} marketStatus={marketStatus} />}
          </div>
        </div>
      </div>
      <div className="border-t border-[#E5E5E5] px-[25px] h-[45px] flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <CategoryIcon /> <div>Categorical</div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[#999999]">Open interest:</span> <div>15M DAI</div> <DaiLogo />
          </div>
        </div>
        <div className="text-[#00C42B] flex items-center space-x-2">
          <CheckCircleIcon />
          <div>Verified</div>
        </div>
      </div>
    </div>
  );
}
