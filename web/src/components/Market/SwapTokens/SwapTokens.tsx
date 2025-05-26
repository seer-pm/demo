import { Dropdown } from "@/components/Dropdown";
import { COLLATERAL_TOKENS, getLiquidityUrl } from "@/lib/config";
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
  outcomeText: string;
  outcomeToken: Token;
  hasEnoughLiquidity?: boolean;
  outcomeImage?: string;
  isInvalidResult: boolean;
  parentCollateral: Token | undefined;
}

export function SwapTokens({
  market,
  outcomeText,
  outcomeToken,
  hasEnoughLiquidity,
  outcomeImage,
  isInvalidResult,
  parentCollateral,
}: SwapTokensProps) {
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [swapType, setSwapType] = useState<"buy" | "sell">("buy");
  const tabClick = (type: "buy" | "sell") => () => setSwapType(type);
  const [isShowMaxSlippage, setShowMaxSlippage] = useState(false);

  const sDAI = COLLATERAL_TOKENS[market.chainId].primary;

  return (
    <div className="space-y-5 bg-white p-[24px] shadow-md">
      <div className="flex items-center space-x-[12px]">
        <div className="flex-shrink-0">
          <OutcomeImage image={outcomeImage} isInvalidOutcome={isInvalidResult} title={outcomeText} />
        </div>
        <div className="text-[16px]">{outcomeText}</div>
      </div>
      {hasEnoughLiquidity === false && (
        <Alert type="warning">
          This outcome lacks sufficient liquidity for trading. You can mint tokens or{" "}
          <a
            href={getLiquidityUrl(market.chainId, outcomeToken.address, parentCollateral?.address || sDAI.address)}
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
              outcomeText={outcomeText}
              outcomeToken={outcomeToken}
              parentCollateral={parentCollateral}
              swapType={swapType}
              setShowMaxSlippage={setShowMaxSlippage}
            />
          )}
          {orderType === "limit" && (
            <SwapTokensLimit
              market={market}
              outcomeText={outcomeText}
              outcomeToken={outcomeToken}
              parentCollateral={parentCollateral}
              swapType={swapType}
            />
          )}
        </div>
      )}
      {isShowMaxSlippage && <SwapTokensMaxSlippage onReturn={() => setShowMaxSlippage(false)} />}
    </div>
  );
}
