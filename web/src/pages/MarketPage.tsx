import { Card } from "@/components/Card";
import Button from "@/components/Form/Button";
import { AnswerForm, AnswerFormLink } from "@/components/Market/AnswerForm";
import { CowSwapEmbed } from "@/components/Market/CowSwapEmbed";
import { MergeForm } from "@/components/Market/MergeForm";
import { Positions } from "@/components/Market/Positions";
import { RedeemForm } from "@/components/Market/RedeemForm";
import { SplitForm } from "@/components/Market/SplitForm";
import { Spinner } from "@/components/Spinner";
import { Market, useMarket } from "@/hooks/useMarket";
import { MarketStatus, useMarketStatus } from "@/hooks/useMarketStatus";
import { useResolveMarket } from "@/hooks/useResolveMarket";
import { useWrappedAddresses } from "@/hooks/useWrappedAddresses";
import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS, getRouterAddress } from "@/lib/config";
import { getClosingTime } from "@/lib/market";
import { getAnswerText, getCurrentBond } from "@/lib/reality";
import { displayBalance } from "@/lib/utils";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Address, TransactionReceipt } from "viem";
import { useAccount } from "wagmi";

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
    return <div>Closes on {getClosingTime(market)}</div>;
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

function MarketPage() {
  const { address: account } = useAccount();

  const [swapType, setSwapType] = useState<"buy" | "sell">("buy");
  const [outcomeIndex, setOutcomeIndex] = useState(0);

  const params = useParams();
  const id = params.id as Address;
  const chainId = Number(params.chainId) as SupportedChain;

  const router = getRouterAddress(chainId);

  const { data: market, isError: isMarketError, isPending: isMarketPending } = useMarket(id as Address, chainId);
  const { data: marketStatus } = useMarketStatus(market, chainId);
  const { data: wrappedAddresses = [] } = useWrappedAddresses(
    chainId,
    router,
    market?.conditionId,
    market?.outcomes.length,
  );

  if (isMarketError) {
    return (
      <div className="py-10 px-10">
        <div className="alert alert-error mb-5">Market not found</div>
      </div>
    );
  }

  if (isMarketPending || !router || !market) {
    return (
      <div className="py-10 px-10">
        <Spinner />
      </div>
    );
  }

  const tradeCallback = (action: "buy" | "sell", poolIndex: number) => {
    setSwapType(action);
    setOutcomeIndex(poolIndex);
  };

  return (
    <div className="py-10 px-10">
      <div className="space-y-5">
        <div className="text-4xl font-bold">{market.marketName}</div>
        {market && marketStatus && <MarketInfo market={market} marketStatus={marketStatus} />}

        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-8 space-y-5">
            {market && (
              <Positions
                account={account}
                chainId={chainId}
                router={router}
                market={market}
                tradeCallback={tradeCallback}
              />
            )}
          </div>
          <div className="col-span-4 space-y-5">
            <CowSwapEmbed
              chainId={chainId}
              sellAsset={
                swapType === "sell" ? wrappedAddresses[outcomeIndex] : COLLATERAL_TOKENS[chainId].primary.address
              }
              buyAsset={
                swapType === "buy" ? wrappedAddresses[outcomeIndex] : COLLATERAL_TOKENS[chainId].primary.address
              }
            />

            <Card title="Split Position">
              <SplitForm
                account={account}
                chainId={chainId}
                router={router}
                conditionId={market.conditionId}
                outcomeSlotCount={market.outcomes.length}
              />
            </Card>

            <Card title="Merge Positions">
              <MergeForm
                account={account}
                chainId={chainId}
                router={router}
                conditionId={market.conditionId}
                outcomeSlotCount={market.outcomes.length}
              />
            </Card>

            {marketStatus === MarketStatus.CLOSED && (
              <RedeemForm
                account={account}
                chainId={chainId}
                router={router}
                conditionId={market.conditionId}
                outcomeSlotCount={market.outcomes.length}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketPage;
