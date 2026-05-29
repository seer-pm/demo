import { Dropdown } from "@/components/Dropdown";
import { useModal } from "@/hooks/useModal";
import { getLiquidityUrlByMarket, marketSupportsOrderBook } from "@seer-pm/sdk";
import { Market } from "@seer-pm/sdk";
import type { Token } from "@seer-pm/sdk";
import clsx from "clsx";
import { useState } from "react";
import { clientOnly } from "vike-react/clientOnly";
import { Alert } from "../../Alert";
import { OutcomeImage } from "../OutcomeImage";
import { SwapTokensLimitUpto } from "./SwapTokensLimitUpTo";
import { SwapTokensMarket } from "./SwapTokensMarket";
import SwapTokensMaxSlippage from "./SwapTokensMaxSlippage";

const AddLiquidityV4Adapter = clientOnly(async () => {
  const mod = await import("../AddLiquidity/AddLiquidityV4Adapter");
  return mod.AddLiquidityV4Adapter;
});

const SwapTokensLimitOrder = clientOnly(async () => {
  const mod = await import("./SwapTokensLimitOrder");
  return mod.SwapTokensLimitOrder;
});

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
  const [orderType, setOrderType] = useState<"market" | "limit-up-to" | "limit-order">("market");
  const [isShowMaxSlippage, setShowMaxSlippage] = useState(false);
  const {
    Modal: LiquidityModal,
    openModal: openLiquidityModal,
    closeModal: closeLiquidityModal,
  } = useModal("swap-add-liquidity-modal");

  const outcomeText = market.outcomes[outcomeIndex];
  const isInvalidOutcome = market.type === "Generic" && outcomeIndex === market.wrappedTokens.length - 1;
  const useInAppLiquidity = marketSupportsOrderBook(market);

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
              href={getLiquidityUrlByMarket(market, outcomeIndex)}
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
                  { text: "Fill-to-price", value: "limit-up-to" },
                  ...(useInAppLiquidity ? [{ text: "Limit order", value: "limit-order" as const }] : []),
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
          {orderType === "limit-up-to" && (
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
