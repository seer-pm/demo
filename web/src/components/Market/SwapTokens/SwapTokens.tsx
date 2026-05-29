import { Dropdown } from "@/components/Dropdown";
import { useModal } from "@/hooks/useModal";
import { getLiquidityUrl, isFillToEstimateEnabled, marketSupportsOrderBook } from "@seer-pm/sdk";
import { Market } from "@seer-pm/sdk";
import type { Token } from "@seer-pm/sdk";
import { useState } from "react";
import { Alert } from "../../Alert";
import { AddLiquidityV4Adapter } from "../AddLiquidity/AddLiquidityV4Adapter";
import { OutcomeImage } from "../OutcomeImage";
import { SwapTokensFillToEstimate } from "./SwapTokensFillToEstimate";
import { SwapTokensLimitOrder } from "./SwapTokensLimitOrder";
import { SwapTokensLimitUpto } from "./SwapTokensLimitUpTo";
import { SwapTokensMarket } from "./SwapTokensMarket";
import SwapTokensMaxSlippage from "./SwapTokensMaxSlippage";

type SwapOrderType = "market" | "limit" | "fill-to-estimate" | "limit-order";

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
  const {
    Modal: LiquidityModal,
    openModal: openLiquidityModal,
    closeModal: closeLiquidityModal,
  } = useModal("swap-add-liquidity-modal");

  const outcomeText = market.outcomes[outcomeIndex];
  const isInvalidOutcome = market.type === "Generic" && outcomeIndex === market.wrappedTokens.length - 1;
  const showFillToEstimate = isFillToEstimateEnabled(market);
  const useInAppLiquidity = marketSupportsOrderBook(market);

  const orderTypeOptions = [
    { text: "Market", value: "market" as const },
    { text: "Fill-to-price", value: "limit" as const },
    ...(showFillToEstimate ? [{ text: "Fill-to-estimate", value: "fill-to-estimate" as const }] : []),
    ...(useInAppLiquidity ? [{ text: "Limit order", value: "limit-order" as const }] : []),
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
          {useInAppLiquidity ? (
            <button type="button" onClick={openLiquidityModal} className="text-purple-primary hover:underline">
              provide liquidity.
            </button>
          ) : (
            <a
              href={getLiquidityUrl(market, outcomeIndex)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-primary"
            >
              provide liquidity.
            </a>
          )}
        </Alert>
      )}
      {!isShowMaxSlippage && (
        <div className="space-y-5">
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
              onOutcomeChange={onOutcomeChange}
            />
          )}
          {orderType === "fill-to-estimate" && (
            <SwapTokensFillToEstimate
              market={market}
              fixedCollateral={fixedCollateral}
              setShowMaxSlippage={setShowMaxSlippage}
            />
          )}
          {orderType === "limit-order" && (
            <SwapTokensLimitOrder
              market={market}
              outcomeIndex={outcomeIndex}
              outcomeToken={outcomeToken}
              fixedCollateral={fixedCollateral}
              outcomeImage={outcomeImage}
              isInvalidOutcome={isInvalidOutcome}
              onAddLiquidity={openLiquidityModal}
            />
          )}
        </div>
      )}
      {isShowMaxSlippage && <SwapTokensMaxSlippage onReturn={() => setShowMaxSlippage(false)} />}
      {useInAppLiquidity && (
        <LiquidityModal
          title="Add Liquidity"
          content={
            <AddLiquidityV4Adapter market={market} outcomeIndex={outcomeIndex} closeModal={closeLiquidityModal} />
          }
        />
      )}
    </div>
  );
}
