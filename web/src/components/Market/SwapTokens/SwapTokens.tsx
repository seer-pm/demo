import { getLiquidityUrlByMarket, isFillToEstimateEnabled } from "@seer-pm/sdk";
import { Market } from "@seer-pm/sdk";
import type { Token } from "@seer-pm/sdk";
import clsx from "clsx";
import { useState } from "react";
import { Alert } from "../../Alert";
import { OrderTypeSelect } from "./OrderTypeSelect";
import { SwapTokensFillToEstimate } from "./SwapTokensFillToEstimate";
import { SwapTokensLimitUpto } from "./SwapTokensLimitUpTo";
import { SwapTokensMarket } from "./SwapTokensMarket";
import SwapTokensMaxSlippage from "./SwapTokensMaxSlippage";

type SwapOrderType = "market" | "limit" | "fill-to-estimate";

interface SwapTokensProps {
  market: Market;
  outcomeIndex: number;
  outcomeToken: Token;
  hasEnoughLiquidity?: boolean;
  outcomeImage?: string;
  fixedCollateral: Token | undefined;
  onOutcomeChange: (i: number, isClick: boolean) => void;

  actionsRow?: React.ReactNode;

  actionFormPanel?: React.ReactNode;
}

export function SwapTokens({
  market,
  outcomeIndex,
  outcomeToken,
  hasEnoughLiquidity,
  outcomeImage,
  fixedCollateral,
  onOutcomeChange,
  actionsRow,
  actionFormPanel,
}: SwapTokensProps) {
  const [orderType, setOrderType] = useState<SwapOrderType>("market");
  const [isShowMaxSlippage, setShowMaxSlippage] = useState(false);

  const outcomeText = market.outcomes[outcomeIndex];
  const beforeParen = outcomeText.split("(")[0].trim();
  const cleaned = beforeParen.length > 0 ? beforeParen : outcomeText.trim();
  const outcomeWords = cleaned.split(/\s+/);
  const outcomeTabTitle = outcomeWords.length > 2 ? outcomeWords.slice(0, 2).join(" ") : cleaned;
  const isInvalidOutcome = market.type === "Generic" && outcomeIndex === market.wrappedTokens.length - 1;
  const showFillToEstimate = isFillToEstimateEnabled(market);

  const orderTypeOptions = [
    { text: "Market", value: "market" as const },
    { text: "Fill-to-price", value: "limit" as const },
    ...(showFillToEstimate ? [{ text: "Fill-to-estimate", value: "fill-to-estimate" as const }] : []),
  ];

  return (
    <div className="card-box purchase-card">
      {/* Tab bar: active outcome + (Generic only) Market / Fill-to-price selector */}
      <div className="purchase-tabs">
        <div className="purchase-tab active" title={outcomeText}>
          {outcomeTabTitle}
        </div>
        {/* Futarchy markets only support Market orders */}
        {market.type === "Generic" && (
          <OrderTypeSelect options={orderTypeOptions} value={orderType} onChange={(type) => setOrderType(type)} />
        )}
      </div>
      <div className="buy-body space-y-5">
        {hasEnoughLiquidity === false && (
          <Alert type="warning">
            This outcome lacks sufficient liquidity for trading. You can mint tokens or{" "}
            <a
              href={getLiquidityUrlByMarket(market, outcomeIndex)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-primary"
            >
              provide liquidity.
            </a>
          </Alert>
        )}
        {!isShowMaxSlippage && (
          <div
            className={clsx(
              "space-y-5",
              hasEnoughLiquidity === false && orderType === "market" && "grayscale opacity-40 pointer-events-none",
            )}
          >
            {orderType === "market" && (
              <SwapTokensMarket
                market={market}
                outcomeIndex={outcomeIndex}
                outcomeToken={outcomeToken}
                fixedCollateral={fixedCollateral}
                setShowMaxSlippage={setShowMaxSlippage}
                outcomeImage={outcomeImage}
                isInvalidOutcome={isInvalidOutcome}
                onOutcomeChange={onOutcomeChange}
              />
            )}
            {orderType === "limit" && (
              <SwapTokensLimitUpto
                market={market}
                outcomeIndex={outcomeIndex}
                outcomeToken={outcomeToken}
                fixedCollateral={fixedCollateral}
                setShowMaxSlippage={setShowMaxSlippage}
                outcomeImage={outcomeImage}
                isInvalidOutcome={isInvalidOutcome}
              />
            )}
            {orderType === "fill-to-estimate" && (
              <SwapTokensFillToEstimate
                market={market}
                fixedCollateral={fixedCollateral}
                setShowMaxSlippage={setShowMaxSlippage}
              />
            )}
          </div>
        )}
        {isShowMaxSlippage && <SwapTokensMaxSlippage onReturn={() => setShowMaxSlippage(false)} />}
      </div>
      {/* Action strip lives INSIDE the card-box so it's visually attached
          to the bottom of the purchase panel (sample's `.actions-row`).
          The expansion panel below renders the active action's form as a
          continuation of the strip (see .action-form-panel in index.scss). */}
      {actionsRow}
      {actionFormPanel}
    </div>
  );
}
