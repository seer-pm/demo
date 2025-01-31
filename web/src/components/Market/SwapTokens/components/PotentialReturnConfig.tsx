import Input from "@/components/Form/Input";
import MultiSelect from "@/components/Form/MultiSelect";
import { useSDaiDaiRatio } from "@/hooks/trade/handleSDAI";
import { Market } from "@/hooks/useMarket";
import { Visibility } from "@/lib/icons";
import { MarketTypes, getMarketType } from "@/lib/market";
import { Token } from "@/lib/tokens";
import { useEffect, useRef, useState } from "react";

function PotentialReturnConfig({
  market,
  returnPerToken,
  setReturnPerToken,
  selectedCollateral,
  outcomeToken,
  outcomeText,
  isCollateralDai,
}: {
  market: Market;
  returnPerToken: number;
  setReturnPerToken: (returnPerToken: number) => void;
  selectedCollateral: Token;
  outcomeToken: Token;
  outcomeText: string;
  isCollateralDai: boolean;
}) {
  const [isShow, setShow] = useState(false);
  const [input, setInput] = useState<{ multiCategorical: string[]; scalar: number; multiScalar: number[] }>({
    multiCategorical: [],
    scalar: 0,
    multiScalar: [],
  });
  const multiSelectRef = useRef<HTMLDivElement>(null);
  const renderInputByMarketType = () => {
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
              value={input.scalar}
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
                  value={input.multiScalar[index]}
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
  };

  useEffect(() => {
    const marketType = getMarketType(market);
    const outcomeTokenIndex = market.wrappedTokens.findIndex((x) => x === outcomeToken.address);
    switch (marketType) {
      case MarketTypes.SCALAR: {
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
        if (!input.multiCategorical.includes(outcomeText)) {
          setReturnPerToken(0);
          break;
        }
        setReturnPerToken(input.multiCategorical.length > 0 ? 1 / input.multiCategorical.length : 1);
        break;
      }
      case MarketTypes.MULTI_SCALAR: {
        const sum = input.multiScalar.reduce((acc, curr) => acc + curr, 0);
        setReturnPerToken(sum ? (input.multiScalar[outcomeTokenIndex] ?? 0) / sum : 0);
      }
    }
  }, [input.multiCategorical, input.scalar, input.multiScalar]);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (multiSelectRef.current?.contains(event.target as Node)) {
        return;
      }
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShow(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const { sDaiToDai } = useSDaiDaiRatio(market.chainId);
  const returnPerTokenDai = returnPerToken * (sDaiToDai ?? 0);
  return (
    <div ref={wrapperRef}>
      <button type="button" className="flex hover:opacity-80" onClick={() => setShow((state) => !state)}>
        <Visibility />
      </button>
      {isShow && (
        <div className="bg-white border border-black-secondary p-2 drop-shadow absolute w-[300px] left-0 bottom-[25px] space-y-2">
          <p className="text-[14px]">Enter a possible market resolution to see your potential return.</p>
          <p className="text-[14px] font-semibold text-purple-primary">Current Outcome: {outcomeText}</p>
          <div className="max-h-[200px] overflow-auto">{renderInputByMarketType()}</div>
          <p>
            Return per token:{" "}
            <span className="font-semibold text-purple-primary">
              {returnPerToken.toFixed(3)} {isCollateralDai ? "sDAI" : selectedCollateral.symbol}
              {isCollateralDai ? ` (${returnPerTokenDai.toFixed(3)} ${selectedCollateral.symbol})` : ""}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

export default PotentialReturnConfig;
