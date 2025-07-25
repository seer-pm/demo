import { Dropdown } from "@/components/Dropdown";
import { getLiquidityUrlByMarket } from "@/lib/config";
import { Market } from "@/lib/market";
import { Token } from "@/lib/tokens";
import clsx from "clsx";
import { useState } from "react";
import { Alert } from "../../Alert";
import { OutcomeImage } from "../OutcomeImage";
import { SwapTokensLimit } from "./SwapTokensLimit";
import { SwapTokensMarket } from "./SwapTokensMarket";
import SwapTokensMaxSlippage from "./SwapTokensMaxSlippage";

interface SwapTokensProps {
  market: Market;
  outcomeIndex: number;
  outcomeToken: Token;
  hasEnoughLiquidity?: boolean;
  outcomeImage?: string;
  fixedCollateral: Token | undefined;
}

export function SwapTokens({
  market,
  outcomeIndex,
  outcomeToken,
  hasEnoughLiquidity,
  outcomeImage,
  fixedCollateral,
}: SwapTokensProps) {
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [swapType, setSwapType] = useState<"buy" | "sell">("buy");
  const tabClick = (type: "buy" | "sell") => () => setSwapType(type);
  const [isShowMaxSlippage, setShowMaxSlippage] = useState(false);

  const outcomeText = market.outcomes[outcomeIndex];

  return (
    <div className="space-y-5 bg-white p-[24px] shadow-md">
      <div className="flex items-center space-x-[12px]">
        <div className="flex-shrink-0">
          <OutcomeImage
            image={outcomeImage}
            isInvalidOutcome={market.type === "Generic" && outcomeIndex === market.wrappedTokens.length - 1}
            title={outcomeText}
          />
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
          <div className="flex items-center justify-between">
            <div role="tablist" className="tabs tabs-bordered">
              <button
                type="button"
                role="tab"
                className={`tab ${swapType === "buy" && "tab-active"}`}
                onClick={tabClick("buy")}
              >
                Buy
              </button>
              <button
                type="button"
                role="tab"
                className={`tab ${swapType === "sell" && "tab-active"}`}
                onClick={tabClick("sell")}
              >
                Sell
              </button>
            </div>
            <Dropdown
              options={[
                { text: "Market", value: "market" },
                { text: "Limit", value: "limit" },
              ]}
              value={orderType}
              onClick={(type) => setOrderType(type)}
              defaultLabel="Order Type"
            />
          </div>
          {orderType === "market" && (
            <SwapTokensMarket
              market={market}
              outcomeIndex={outcomeIndex}
              outcomeToken={outcomeToken}
              fixedCollateral={fixedCollateral}
              swapType={swapType}
              setShowMaxSlippage={setShowMaxSlippage}
            />
          )}
          {orderType === "limit" && (
            <SwapTokensLimit
              market={market}
              outcomeIndex={outcomeIndex}
              outcomeToken={outcomeToken}
              parentCollateral={fixedCollateral}
              swapType={swapType}
            />
          )}
        </div>
      )}
      {isShowMaxSlippage && <SwapTokensMaxSlippage onReturn={() => setShowMaxSlippage(false)} />}
    </div>
  );
}
