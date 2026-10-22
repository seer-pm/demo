import { Dropdown } from "@/components/Dropdown";
import { useMarketTradeDraft, useTradeOrderType } from "@/hooks/useTradeFormDraft";
import { useMarket, useMarketOdds } from "@seer-pm/react";
import {
  MarketTypes,
  displayScalarBound,
  getActivePrimaryCollateral,
  getLiquidityUrlByMarket,
  getMarketType,
  isFillToEstimateEnabled,
  isOdd,
} from "@seer-pm/sdk";
import { Market } from "@seer-pm/sdk";
import type { SupportedChain, Token } from "@seer-pm/sdk";
import { useRef, useState } from "react";
import { zeroAddress } from "viem";
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

/**
 * The selected outcome's current price, in the unit the outcome rows use: a chance for markets
 * that pay one or nothing, a collateral price for scalar-style markets where the token pays a
 * fraction.
 */
function OutcomeQuote({
  market,
  outcomeIndex,
  collateral,
}: { market: Market; outcomeIndex: number; collateral: Token }) {
  const { data: odds = [] } = useMarketOdds(market, true);
  const odd = odds[outcomeIndex];
  if (!isOdd(odd)) {
    return null;
  }
  const marketType = getMarketType(market);
  if (marketType === MarketTypes.SCALAR || marketType === MarketTypes.MULTI_CATEGORICAL) {
    return (
      <p className="text-right leading-tight">
        <span className="block text-[17px] font-semibold tabular-nums">{(odd! / 100).toFixed(3)}</span>
        <span className="block text-[12px] text-[var(--seer-muted)]">{collateral.symbol} per share</span>
      </p>
    );
  }
  return (
    <p className="text-right leading-tight">
      <span className="block text-[17px] font-semibold tabular-nums">{odd}%</span>
      <span className="block text-[12px] text-[var(--seer-muted)]">chance</span>
    </p>
  );
}

/** Scalar UP/DOWN tokens only make sense against the range they settle on. */
function ScalarOutcomeNote({ market, outcomeIndex }: { market: Market; outcomeIndex: number }) {
  if (getMarketType(market) !== MarketTypes.SCALAR || outcomeIndex > 1) {
    return null;
  }
  const lower = displayScalarBound(market.lowerBound).toLocaleString();
  const upper = displayScalarBound(market.upperBound).toLocaleString();
  return (
    <p className="text-[12px] leading-snug text-[var(--seer-muted)]">
      {outcomeIndex === 0
        ? `Pays more the lower the answer lands between ${lower} and ${upper}.`
        : `Pays more the higher the answer lands between ${lower} and ${upper}.`}
    </p>
  );
}

/**
 * A child market trades against a parent outcome token, whose symbol alone (e.g. `LEPEN_NRYES`)
 * does not say what it is.
 */
function ChildCollateralNote({ market, collateral }: { market: Market; collateral: Token }) {
  const { data: parentMarket } = useMarket(market.parentMarket.id, market.chainId as SupportedChain);
  const parentOutcomeText = parentMarket?.outcomes[Number(market.parentOutcome)];
  if (!parentOutcomeText) {
    return null;
  }
  return (
    <p className="text-[12px] leading-snug text-[var(--seer-muted)]">
      Paid in {collateral.symbol}, the parent market's “{parentOutcomeText}” token.
    </p>
  );
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
  const orderTypeRef = useRef<HTMLDivElement>(null);

  const outcomeText = market.outcomes[outcomeIndex];
  const isInvalidOutcome = market.type === "Generic" && outcomeIndex === market.wrappedTokens.length - 1;
  const showFillToEstimate = isFillToEstimateEnabled(market);

  const quoteCollateral = fixedCollateral ?? getActivePrimaryCollateral(market.chainId);
  const isChildMarket = market.type === "Generic" && market.parentMarket.id !== zeroAddress && fixedCollateral;

  const orderTypeOptions = [
    { text: "Market", value: "market" as const },
    { text: "Fill-to-price", value: "limit" as const },
    ...(showFillToEstimate ? [{ text: "Fill-to-estimate", value: "fill-to-estimate" as const }] : []),
  ];

  // Futarchy markets only support Market orders
  const orderTypeControl =
    market.type === "Generic" ? (
      <div ref={orderTypeRef}>
        <Dropdown
          options={orderTypeOptions}
          value={orderType}
          onClick={(value) => {
            setDraft({ orderType: value });
            // Each order type renders its own form, which remounts this control: put focus back on it.
            requestAnimationFrame(() => orderTypeRef.current?.querySelector("button")?.focus());
          }}
          defaultLabel="Order type"
        />
      </div>
    ) : null;

  return (
    <div className="seer-swap-widget space-y-5 bg-base-100 p-[24px] shadow-md">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <OutcomeImage image={outcomeImage} isInvalidOutcome={isInvalidOutcome} title={outcomeText} />
          </div>
          <p className="min-w-0 flex-1 text-[16px] font-semibold leading-snug break-words">{outcomeText}</p>
          {!isInvalidOutcome && (
            <OutcomeQuote market={market} outcomeIndex={outcomeIndex} collateral={quoteCollateral} />
          )}
        </div>
        <ScalarOutcomeNote market={market} outcomeIndex={outcomeIndex} />
        {isChildMarket && <ChildCollateralNote market={market} collateral={fixedCollateral} />}
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
        <div className="space-y-5">
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
              orderTypeControl={orderTypeControl}
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
              orderTypeControl={orderTypeControl}
            />
          )}
          {orderType === "fill-to-estimate" && (
            <SwapTokensFillToEstimate
              market={market}
              fixedCollateral={fixedCollateral}
              setShowMaxSlippage={setShowMaxSlippage}
              orderTypeControl={orderTypeControl}
            />
          )}
        </div>
      )}
      {isShowMaxSlippage && <SwapTokensMaxSlippage onReturn={() => setShowMaxSlippage(false)} />}
    </div>
  );
}
