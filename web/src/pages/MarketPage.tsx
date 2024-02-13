import { Card } from "@/components/Card";
import Button from "@/components/Form/Button";
import { AnswerForm, AnswerFormLink } from "@/components/Market/AnswerForm";
import { MergeForm } from "@/components/Market/MergeForm";
import { Positions } from "@/components/Market/Positions";
import { RedeemForm } from "@/components/Market/RedeemForm";
import { SplitForm } from "@/components/Market/SplitForm";
import { Spinner } from "@/components/Spinner";
import { Market, useMarket } from "@/hooks/useMarket";
import { useMarketFactory } from "@/hooks/useMarketFactory";
import { MarketStatus, useMarketStatus } from "@/hooks/useMarketStatus";
import { useResolveMarket } from "@/hooks/useResolveMarket";
import { getConfigAddress } from "@/lib/config";
import { getAnswerText, getCurrentBond } from "@/lib/reality";
import { displayBalance } from "@/lib/utils";
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
    return <div>Closes on {new Date(market.question.opening_ts * 1000).toUTCString()}</div>;
  }

  if (marketStatus === MarketStatus.CLOSED) {
    return <div>Market closed. Result: {getAnswerText(market)}</div>;
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
    return (
      <div>
        <div>
          This market is not resolved yet. You can provide an answer below, depositing a bond of{" "}
          {displayBalance(getCurrentBond(market.question.bond, market.question.min_bond), 18)} DAI.
        </div>
        <div>
          Current answer: {getAnswerText(market)}.
          {market.question.finalize_ts > 0 && (
            <>Closes on {new Date(market.question.finalize_ts * 1000).toUTCString()}</>
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
  const { address } = useAccount();

  const params = useParams();
  const id = params.id as Address;
  const chainId = Number(params.chainId);

  const { data: market, isError: isMarketError, isPending: isMarketPending } = useMarket(id as Address);
  const { data: marketFactory, isError: isFactoryError, isPending: isFactoryPending } = useMarketFactory(chainId);
  const { data: marketStatus } = useMarketStatus(market, chainId);

  const router = getConfigAddress("ROUTER", chainId);

  if (isMarketError || isFactoryError) {
    return (
      <div className="py-10 px-10">
        <div className="alert alert-error mb-5">Market not found</div>
      </div>
    );
  }

  if (isMarketPending || isFactoryPending || !router || !market || !marketFactory) {
    return (
      <div className="py-10 px-10">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="py-10 px-10">
      <div className="space-y-5">
        <div className="text-4xl font-bold">{market.marketName}</div>
        {market && marketStatus && <MarketInfo market={market} marketStatus={marketStatus} />}

        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-8 space-y-5">
            {address && market && marketFactory && (
              <>
                <Positions address={address} router={router} market={market} marketFactory={marketFactory} />
                {/* show tokens, liquidity, etc */}
              </>
            )}
          </div>
          <div className="col-span-4 space-y-5">
            {marketStatus === MarketStatus.OPEN && (
              <>
                <Card title="Split Position">
                  <SplitForm
                    account={address}
                    chainId={chainId}
                    router={router}
                    collateralToken={marketFactory.collateralToken}
                    conditionId={market.conditionId}
                    outcomeSlotCount={market.outcomes.length}
                  />
                </Card>
                <Card title="Merge Positions">
                  <MergeForm
                    account={address}
                    chainId={chainId}
                    router={router}
                    conditionalTokens={marketFactory.conditionalTokens}
                    collateralToken={marketFactory.collateralToken}
                    conditionId={market.conditionId}
                    outcomeSlotCount={market.outcomes.length}
                  />
                </Card>
              </>
            )}
            {marketStatus === MarketStatus.CLOSED && (
              <RedeemForm
                account={address}
                chainId={chainId}
                router={router}
                conditionalTokens={marketFactory.conditionalTokens}
                collateralToken={marketFactory.collateralToken}
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
