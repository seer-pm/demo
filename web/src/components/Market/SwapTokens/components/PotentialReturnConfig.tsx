import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import MultiSelect from "@/components/Form/MultiSelect";
import { useQuoteTrade } from "@/hooks/trade";
import { useSDaiDaiRatio } from "@/hooks/trade/handleSDAI";
import { Market } from "@/hooks/useMarket";
import { useModal } from "@/hooks/useModal";
import { useTokensInfo } from "@/hooks/useTokenInfo";
import { MarketTypes, getMarketType } from "@/lib/market";
import { Token, getCollateralPerShare, getPotentialReturn } from "@/lib/tokens";
import { isTwoStringsEqual, isUndefined } from "@/lib/utils";
import { Dispatch, ReactNode, SetStateAction, useEffect, useRef, useState } from "react";
import { formatUnits, zeroAddress } from "viem";
import { PotentialReturnResult } from "./PotentialReturn";

function getScalarReturnPerToken(market: Market, outcomeTokenIndex: number, forecast: number) {
  if (outcomeTokenIndex === 0) {
    // DOWN Token
    if (forecast <= Number(market.lowerBound)) {
      return 1;
    }

    if (forecast >= Number(market.upperBound)) {
      return 0;
    }
    return (Number(market.upperBound) - forecast) / (Number(market.upperBound) - Number(market.lowerBound));
  }

  // UP Token
  if (forecast <= Number(market.lowerBound)) {
    return 0;
  }
  if (forecast >= Number(market.upperBound)) {
    return 1;
  }
  return (forecast - Number(market.lowerBound)) / (Number(market.upperBound) - Number(market.lowerBound));
}

function getMultiCategoricalReturnPerToken(outcomeText: string, forecast: string[]) {
  if (!forecast.includes(outcomeText)) {
    return 0;
  }
  return forecast.length > 0 ? 1 / forecast.length : 1;
}

function getMultiScalarReturnPerToken(outcomeTokenIndex: number, forecast: number[]) {
  const sum = forecast.reduce((acc, curr) => acc + (curr ?? 0), 0);
  return sum ? (forecast[outcomeTokenIndex] ?? 0) / sum : 0;
}

function RenderInputByMarketType({
  market,
  outcomeToken,
  outcomeText,
  input,
  setInput,
  setReturnPerToken,
}: {
  market: Market;
  outcomeToken: Token;
  outcomeText: string;
  input: PotentialReturnInput;
  setInput: Dispatch<SetStateAction<PotentialReturnInput>>;
  setReturnPerToken: (returnPerToken: number) => void;
}): ReactNode {
  const marketType = getMarketType(market);

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
        setReturnPerToken(getScalarReturnPerToken(market, outcomeTokenIndex, input.scalar));
        break;
      }
      case MarketTypes.MULTI_CATEGORICAL: {
        if (!input.multiCategorical.length) {
          setInput((state) => ({ ...state, multiCategorical: [outcomeText] }));
          break;
        }
        setReturnPerToken(getMultiCategoricalReturnPerToken(outcomeText, input.multiCategorical));
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
        setReturnPerToken(getMultiScalarReturnPerToken(outcomeTokenIndex, input.multiScalar));
      }
    }
  }, [input, market, outcomeToken, outcomeText, setReturnPerToken, setInput]);

  useEffect(() => {
    if (marketType === MarketTypes.MULTI_SCALAR) {
      return;
    }
    setInput({
      multiCategorical: [],
      scalar: undefined,
      multiScalar: [],
    });
  }, [outcomeText, market, setInput]);

  if (marketType === MarketTypes.MULTI_CATEGORICAL) {
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

  if (marketType === MarketTypes.SCALAR) {
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

  // MarketTypes.MULTI_SCALAR
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

function ScalarForecastChecker({
  market,
  outcomeToken,
  forecast,
  amount,
  selectedCollateral,
  isCollateralDai,
  minPotentialReturn,
  daiToSDai,
  sDaiToDai,
}: {
  market: Market;
  outcomeToken: Token;
  forecast: number;
  amount: string;
  selectedCollateral: Token;
  isCollateralDai: boolean;
  minPotentialReturn: number;
  daiToSDai: number;
  sDaiToDai: number;
}) {
  const { data: outcomeTokens = [] } = useTokensInfo(market.wrappedTokens, market.chainId);

  const otherOutcomeToken = outcomeTokens.find((_token) => _token.address !== outcomeToken.address)!;

  const {
    data: quoteData,
    isLoading: quoteIsLoading,
    // fetchStatus: quoteFetchStatus,
    // error: quoteError,
  } = useQuoteTrade(market.chainId, zeroAddress, amount, otherOutcomeToken, selectedCollateral, "buy");

  if (getMarketType(market) !== MarketTypes.SCALAR || !quoteData) {
    return null;
  }

  const receivedAmount = Number(formatUnits(quoteData.value, quoteData.decimals));
  const collateralPerShare = getCollateralPerShare(
    "buy",
    selectedCollateral,
    quoteData,
    amount,
    receivedAmount,
    isCollateralDai,
    daiToSDai,
  );

  // Find the token object that matches the buyToken address
  const buyTokenIndex = outcomeTokens.findIndex((token) => isTwoStringsEqual(token.address, otherOutcomeToken.address));

  const returnPerToken = getScalarReturnPerToken(market, buyTokenIndex, forecast);

  const { potentialReturn } = getPotentialReturn(
    collateralPerShare,
    returnPerToken,
    isCollateralDai,
    receivedAmount,
    sDaiToDai,
    false,
  );

  if (potentialReturn <= minPotentialReturn) {
    return null;
  }

  if (buyTokenIndex === -1 || quoteIsLoading) {
    return null;
  }

  // find the return for each outcome token
  return (
    <div>
      Best return for your forecast: buy {market.outcomes[buyTokenIndex]}{" "}
      <PotentialReturnResult
        quoteIsLoading={quoteIsLoading}
        isFetching={false}
        isCollateralDai={isCollateralDai}
        selectedCollateral={selectedCollateral}
        receivedAmount={receivedAmount}
        sDaiToDai={sDaiToDai ?? 0}
        returnPerToken={returnPerToken}
        collateralPerShare={collateralPerShare}
        isOneOrNothingPotentialReturn={false}
      />
    </div>
  );
}

type PotentialReturnInput = {
  multiCategorical: string[];
  scalar: number | undefined;
  multiScalar: number[];
};

function PotentialReturnConfig({
  market,
  selectedCollateral,
  outcomeToken,
  outcomeText,
  isCollateralDai,
  quoteIsLoading = false,
  isFetching = false,
  amount,
  receivedAmount,
  collateralPerShare,
}: {
  market: Market;
  selectedCollateral: Token;
  outcomeToken: Token;
  outcomeText: string;
  isCollateralDai: boolean;
  quoteIsLoading: boolean;
  isFetching: boolean;
  amount: string;
  receivedAmount: number;
  collateralPerShare: number;
}) {
  const [input, setInput] = useState<PotentialReturnInput>({
    multiCategorical: [],
    scalar: undefined,
    multiScalar: [],
  });
  const [returnPerToken, setReturnPerToken] = useState(1);
  const { Modal, openModal, closeModal } = useModal("potential-return-config", false);

  const { sDaiToDai, daiToSDai } = useSDaiDaiRatio(market.chainId);
  const returnPerTokenDai = returnPerToken * (sDaiToDai ?? 0);

  const { potentialReturn: minPotentialReturn } = getPotentialReturn(
    collateralPerShare,
    returnPerToken,
    isCollateralDai,
    receivedAmount,
    sDaiToDai,
    false,
  );

  const modalContent = (
    <div className="space-y-2 w-full">
      <p>Enter a possible market resolution to see your potential return.</p>
      <p className="font-semibold text-purple-primary py-4">Current Outcome: {outcomeText}</p>
      <div className="max-h-[200px] overflow-auto">
        <RenderInputByMarketType
          market={market}
          outcomeToken={outcomeToken}
          outcomeText={outcomeText}
          input={input}
          setInput={setInput}
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
      {input.scalar !== undefined && (
        <ScalarForecastChecker
          market={market}
          outcomeToken={outcomeToken}
          selectedCollateral={selectedCollateral}
          forecast={input.scalar}
          amount={amount}
          isCollateralDai={isCollateralDai}
          minPotentialReturn={minPotentialReturn}
          daiToSDai={daiToSDai ?? 0}
          sDaiToDai={sDaiToDai ?? 0}
        />
      )}
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
