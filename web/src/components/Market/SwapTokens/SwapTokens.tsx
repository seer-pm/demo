import { Dropdown } from "@/components/Dropdown";
import { getLiquidityUrlByMarket } from "@/lib/config";
import { Market } from "@/lib/market";
import { Token } from "@/lib/tokens";
import clsx from "clsx";
import { useState } from "react";
import { Alert } from "../../Alert";
import { OutcomeImage } from "../OutcomeImage";
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
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [isShowMaxSlippage, setShowMaxSlippage] = useState(false);

  const outcomeText = market.outcomes[outcomeIndex];
  const isInvalidOutcome = market.type === "Generic" && outcomeIndex === market.wrappedTokens.length - 1;
  return (
    <div className="space-y-5 bg-white p-[24px] shadow-md">
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
          {/* Futarchy markets only support Market orders, while Generic markets support both Market and Fill-to-price orders */}
          {market.type === "Generic" && (
            <div className="flex items-center justify-between">
              <Dropdown
                options={[
                  { text: "Market", value: "market" },
                  { text: "Fill-to-price", value: "limit" },
                ]}
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
        </div>
      )}
      {isShowMaxSlippage && <SwapTokensMaxSlippage onReturn={() => setShowMaxSlippage(false)} />}
    </div>
  );
}
