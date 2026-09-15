import { Dropdown } from "@/components/Dropdown";
import { useMarketTradeDraft, useTradeOrderType } from "@/hooks/useTradeFormDraft";
import { getLiquidityUrlByMarket, isFillToEstimateEnabled } from "@seer-pm/sdk";
import { Market } from "@seer-pm/sdk";
import type { Token } from "@seer-pm/sdk";
import { useState } from "react";
import { Alert } from "../../Alert";
import { OutcomeImage } from "../OutcomeImage";
import { SwapTokensFillToEstimate } from "./SwapTokensFillToEstimate";
import { SwapTokensLimitUpto } from "./SwapTokensLimitUpTo";
import { SwapTokensMarket } from "./SwapTokensMarket";
import SwapTokensMaxSlippage from "./SwapTokensMaxSlippage";

interface SwapTokensProps {
  market: Market;
  outcomeIndex: number;
  outcomeToken: Token;
  hasEnoughLiquidity?: boolean;
  outcomeImage?: string;
  fixedCollateral: Token | undefined;
  onOutcomeChange: (i: number, isClick: boolean) => void;
}

export function SwapTokens({
  market,
  outcomeIndex,
  outcomeToken,
  hasEnoughLiquidity,
  outcomeImage,
  fixedCollateral,
  onOutcomeChange,
}: SwapTokensProps) {
  // The order type lives in the draft store so it survives the widget unmounting.
  const orderType = useTradeOrderType(market);
  const { setDraft } = useMarketTradeDraft(market);
  const [isShowMaxSlippage, setShowMaxSlippage] = useState(false);

  const outcomeText = market.outcomes[outcomeIndex];
  const isInvalidOutcome = market.type === "Generic" && outcomeIndex === market.wrappedTokens.length - 1;
  const showFillToEstimate = isFillToEstimateEnabled(market);

  // Invalid has no pool: it is bought by minting a set and selling the other outcomes, and sold
  // the other way round. That is a market order by construction, so the price-driven order types
  // (and the "provide liquidity" prompt) do not apply to it.
  const orderTypeOptions = [
    { text: "Market", value: "market" as const },
    ...(isInvalidOutcome ? [] : [{ text: "Fill-to-price", value: "limit" as const }]),
    ...(showFillToEstimate && !isInvalidOutcome
      ? [{ text: "Fill-to-estimate", value: "fill-to-estimate" as const }]
      : []),
  ];
  const effectiveOrderType = isInvalidOutcome && orderType !== "market" ? "market" : orderType;

  return (
    <div className="space-y-5 bg-base-100 p-[24px] shadow-md">
      <div className="flex items-center space-x-[12px]">
        <div className="flex-shrink-0">
          <OutcomeImage image={outcomeImage} isInvalidOutcome={isInvalidOutcome} title={outcomeText} />
        </div>
        <div className="text-[16px]">{outcomeText}</div>
      </div>
      {hasEnoughLiquidity === false && isInvalidOutcome && (
        <Alert type="warning">
          {outcomeText} trades through the other outcomes, and at least one of them lacks liquidity. You can still mint
          tokens.
        </Alert>
      )}
      {hasEnoughLiquidity === false && !isInvalidOutcome && (
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
        <div className="space-y-5">
          {/* Futarchy markets only support Market orders */}
          {market.type === "Generic" && (
            <div className="flex items-center justify-between">
              <Dropdown
                options={orderTypeOptions}
                value={effectiveOrderType}
                onClick={(value) => setDraft({ orderType: value })}
                defaultLabel="Order Type"
              />
            </div>
          )}
          {effectiveOrderType === "market" && (
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
          {effectiveOrderType === "limit" && (
            <SwapTokensLimitUpto
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
          {effectiveOrderType === "fill-to-estimate" && (
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
  );
}
