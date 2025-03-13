import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import MultiSelect from "@/components/Form/MultiSelect";
import { useSDaiDaiRatio } from "@/hooks/trade/handleSDAI";
import { Market } from "@/hooks/useMarket";
import { useModal } from "@/hooks/useModal";
import { InputPotentialReturnContext } from "@/lib/context";
import { MarketTypes, getMarketType } from "@/lib/market";
import { Token } from "@/lib/tokens";
import { isUndefined } from "@/lib/utils";
import { ReactNode, useContext, useEffect, useRef } from "react";
import { PotentialReturnResult } from "./PotentialReturn";

function RenderInputByMarketType({
  market,
  outcomeToken,
  outcomeText,
  setReturnPerToken,
}: {
  market: Market;
  outcomeToken: Token;
  outcomeText: string;
  setReturnPerToken: (returnPerToken: number) => void;
}): ReactNode {
  const { input, setInput } = useContext(InputPotentialReturnContext);
  const multiSelectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const marketType = getMarketType(market);
    const outcomeTokenIndex = market.wrappedTokens.findIndex((x) => x === outcomeToken.address);
    switch (marketType) {
      case MarketTypes.SCALAR: {
        if (isUndefined(input.scalar)) {
          if (outcomeTokenIndex === 0) {
            setInput((state) => ({ ...state, scalar: Number(market.lowerBound) }));
            break;
          }
          if (outcomeTokenIndex === 1) {
            setInput((state) => ({ ...state, scalar: Number(market.upperBound) }));
            break;
          }
          break;
        }
        if (outcomeTokenIndex === 0) {
          if (input.scalar <= Number(market.lowerBound)) {
            setReturnPerToken(1);
            break;
          }
          if (input.scalar >= Number(market.upperBound)) {
            setReturnPerToken(0);
            break;
          }
          setReturnPerToken(
            (Number(market.upperBound) - input.scalar) / (Number(market.upperBound) - Number(market.lowerBound)),
          );
        }
        if (outcomeTokenIndex === 1) {
          if (input.scalar <= Number(market.lowerBound)) {
            setReturnPerToken(0);
            break;
          }
          if (input.scalar >= Number(market.upperBound)) {
            setReturnPerToken(1);
            break;
          }
          setReturnPerToken(
            (input.scalar - Number(market.lowerBound)) / (Number(market.upperBound) - Number(market.lowerBound)),
          );
        }
        break;
      }
      case MarketTypes.MULTI_CATEGORICAL: {
        if (!input.multiCategorical.length) {
          setInput((state) => ({ ...state, multiCategorical: [outcomeText] }));
          break;
        }
        if (!input.multiCategorical.includes(outcomeText)) {
          setReturnPerToken(0);
          break;
        }
        setReturnPerToken(input.multiCategorical.length > 0 ? 1 / input.multiCategorical.length : 1);
        break;
      }
      case MarketTypes.MULTI_SCALAR: {
        if (!input.multiScalar[outcomeTokenIndex]) {
          setInput((state) => {
            const defaultPoints = [...state.multiScalar];
            defaultPoints[outcomeTokenIndex] = 1;
            return { ...state, multiScalar: defaultPoints };
          });
          break;
        }
        const sum = input.multiScalar.reduce((acc, curr) => acc + (curr ?? 0), 0);
        setReturnPerToken(sum ? (input.multiScalar[outcomeTokenIndex] ?? 0) / sum : 0);
      }
    }
  }, [input, market, outcomeToken, outcomeText, setReturnPerToken, setInput]);

  useEffect(() => {
    if (getMarketType(market) === MarketTypes.MULTI_SCALAR) {
      return;
    }
    setInput({
      multiCategorical: [],
      scalar: undefined,
      multiScalar: [],
    });
  }, [outcomeText, market, setInput]);

  const marketType = getMarketType(market);
  switch (marketType) {
    case MarketTypes.MULTI_CATEGORICAL: {
      return (
        <div className="space-y-1">
          <p className="whitespace-nowrap">Market resolution:</p>
          <MultiSelect
            ref={multiSelectRef}
            options={market.outcomes.slice(0, -1).map((x) => ({
              value: x,
              text: x,
            }))}
            value={input.multiCategorical ?? []}
            onChange={(values) => setInput((state) => ({ ...state, multiCategorical: values }))}
            placeholder="Select winning outcomes"
          />
        </div>
      );
    }
    case MarketTypes.SCALAR: {
      return (
        <div className="space-y-1">
          <p className="whitespace-nowrap">Market resolution:</p>
          <Input
            type="number"
            className="h-[30px] w-full"
            value={input.scalar || ""}
            onChange={(e) => setInput((state) => ({ ...state, scalar: Number(e.target.value) }))}
          />
        </div>
      );
    }
    case MarketTypes.MULTI_SCALAR: {
      return (
        <div className="space-y-1">
          <p className="whitespace-nowrap">Market resolution:</p>
          {market.outcomes.slice(0, -1).map((outcome, index) => (
            <div key={outcome} className="flex items-center justify-between gap-2">
              <p className="text-[14px]">{outcome}</p>
              <Input
                type="number"
                min="0"
                className="h-[30px] w-[150px]"
                onWheel={(e) => {
                  // stop scrolling
                  (e.target as HTMLInputElement).blur();
                  e.stopPropagation();
                  e.preventDefault();
                }}
                value={input.multiScalar[index] || ""}
                onChange={(e) =>
                  setInput((state) => {
                    const updatedMultiScalar = [...state.multiScalar];
                    updatedMultiScalar[index] = Number(e.target.value);
                    return {
                      ...state,
                      multiScalar: updatedMultiScalar,
                    };
                  })
                }
              />
            </div>
          ))}
        </div>
      );
    }
  }
}

function PotentialReturnConfig({
  market,
  returnPerToken,
  setReturnPerToken,
  selectedCollateral,
  outcomeToken,
  outcomeText,
  isCollateralDai,
  quoteIsLoading = false,
  isFetching = false,
  receivedAmount,
  collateralPerShare,
}: {
  market: Market;
  returnPerToken: number;
  setReturnPerToken: (returnPerToken: number) => void;
  selectedCollateral: Token;
  outcomeToken: Token;
  outcomeText: string;
  isCollateralDai: boolean;
  quoteIsLoading: boolean;
  isFetching: boolean;
  receivedAmount: number;
  collateralPerShare: number;
}) {
  const { Modal, openModal, closeModal } = useModal("potential-return-config", false);

  const { sDaiToDai } = useSDaiDaiRatio(market.chainId);
  const returnPerTokenDai = returnPerToken * (sDaiToDai ?? 0);

  const modalContent = (
    <div className="space-y-2 w-full">
      <p>Enter a possible market resolution to see your potential return.</p>
      <p className="font-semibold text-purple-primary py-4">Current Outcome: {outcomeText}</p>
      <div className="max-h-[200px] overflow-auto">
        <RenderInputByMarketType
          market={market}
          outcomeToken={outcomeToken}
          outcomeText={outcomeText}
          setReturnPerToken={setReturnPerToken}
        />
      </div>
      <p>
        Return per token:{" "}
        <span className="font-semibold text-purple-primary">
          {returnPerToken.toFixed(3)} {isCollateralDai ? "sDAI" : selectedCollateral.symbol}
          {isCollateralDai ? ` (${returnPerTokenDai.toFixed(3)} ${selectedCollateral.symbol})` : ""}
        </span>
      </p>
      <div>
        Potential return:{" "}
        <PotentialReturnResult
          quoteIsLoading={quoteIsLoading}
          isFetching={isFetching}
          isCollateralDai={isCollateralDai}
          selectedCollateral={selectedCollateral}
          receivedAmount={receivedAmount}
          sDaiToDai={sDaiToDai ?? 0}
          returnPerToken={returnPerToken}
          collateralPerShare={collateralPerShare}
          isOneOrNothingPotentialReturn={false}
        />
      </div>

      <div className="text-center pt-4">
        <Button type="button" variant="primary" size="small" text="Close" onClick={closeModal} />
      </div>
    </div>
  );

  return (
    <div>
      <button
        type="button"
        className="hover:opacity-80 text-purple-primary font-medium text-center w-full text-[15px]"
        disabled={receivedAmount === 0}
        onClick={openModal}
      >
        {receivedAmount === 0 ? (
          <div className="tooltip ml-auto">
            <p className="tooltiptext w-[300px] !whitespace-break-spaces">
              You need to buy more than 0 shares to calculate your potential return.
            </p>
            Calculate your potential return
          </div>
        ) : (
          "Calculate your potential return"
        )}
      </button>
      <Modal title="Potential return calculator" content={modalContent} />
    </div>
  );
}

export default PotentialReturnConfig;
