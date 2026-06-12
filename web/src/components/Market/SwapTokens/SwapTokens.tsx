import { Dropdown } from "@/components/Dropdown";
import { getLiquidityUrlByMarket, isFillToEstimateEnabled } from "@seer-pm/sdk";
import { Market } from "@seer-pm/sdk";
import type { Token } from "@seer-pm/sdk";
import clsx from "clsx";
import { useState } from "react";
import { Alert } from "../../Alert";
import { OutcomeImage } from "../OutcomeImage";
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
  const [orderType, setOrderType] = useState<SwapOrderType>("market");
  const [isShowMaxSlippage, setShowMaxSlippage] = useState(false);

  const outcomeText = market.outcomes[outcomeIndex];
  const isInvalidOutcome = market.type === "Generic" && outcomeIndex === market.wrappedTokens.length - 1;
  const showFillToEstimate = isFillToEstimateEnabled(market);

  const orderTypeOptions = [
    { text: "Market", value: "market" as const },
    { text: "Fill-to-price", value: "limit" as const },
    ...(showFillToEstimate ? [{ text: "Fill-to-estimate", value: "fill-to-estimate" as const }] : []),
  ];

  return (
    <div className="space-y-5 bg-base-100 p-[24px] shadow-md">
      <div className="flex items-center space-x-[12px]">
        <div className="flex-shrink-0">
          <OutcomeImage image={outcomeImage} isInvalidOutcome={isInvalidOutcome} title={outcomeText} />
        </div>
        <div className="text-[16px]">{outcomeText}</div>
      </div>
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
          {/* Futarchy markets only support Market orders */}
          {market.type === "Generic" && (
            <div className="flex items-center justify-between">
              <Dropdown
                options={orderTypeOptions}
                value={orderType}
                onClick={(type) => setOrderType(type)}
                defaultLabel="Order Type"
              />
            </div>
          )}
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
  );
}
