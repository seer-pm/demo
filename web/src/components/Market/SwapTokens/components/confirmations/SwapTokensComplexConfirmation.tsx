import { Alert } from "@/components/Alert";
import Button from "@/components/Form/Button";
import { Spinner } from "@/components/Spinner";
import { useTokensInfo } from "@/hooks/useTokenInfo";
import { RightArrow } from "@/lib/icons";
import { Market } from "@/lib/market";
import { Token } from "@/lib/tokens";
import { QuoteTradeResult } from "@/lib/trade";
import { formatUnits } from "viem";

interface SwapTokensComplexConfirmationProps {
  closeModal: () => void;
  reset: () => void;
  quotes: QuoteTradeResult[] | undefined;
  isLoading: boolean;
  onSubmit: () => Promise<void>;
  market: Market;
  collateral: Token;
  amount: number;
  receivedAmount: number;
  mintFactor: number;
}

export function SwapTokensComplexConfirmation({
  closeModal,
  quotes,
  isLoading,
  onSubmit,
  market,
  collateral,
  amount,
  receivedAmount,
  mintFactor,
}: SwapTokensComplexConfirmationProps) {
  const { data: tokens } = useTokensInfo(market.wrappedTokens, market.chainId);
  const tokenAddressToSymbolMapping = tokens?.reduce(
    (acc, curr) => {
      acc[curr.address.toLowerCase()] = curr.symbol;
      return acc;
    },
    {} as { [key: string]: string },
  );
  if (!quotes) {
    return (
      <div className="flex flex-col justify-center items-center">
        <div className="w-[400px] h-[150px] flex items-center justify-center">
          <Spinner />
        </div>

        <div className="flex justify-center space-x-[24px] text-center mt-[32px]">
          <Button type="button" variant="secondary" text="Return" onClick={closeModal} />
        </div>
      </div>
    );
  }

  const buyQuote = quotes[quotes.length - 1];
  const { trade } = buyQuote;
  const inputToken = collateral.symbol;
  const outputToken = trade.outputAmount.currency.symbol;

  const price = (amount / receivedAmount).toFixed(2);
  const maximumSlippage = trade.maximumSlippage.toFixed(2);
  const minimumReceive = (
    amount * mintFactor +
    Number(formatUnits(BigInt(trade.minimumAmountOut().raw.toString()), trade.outputAmount.currency.decimals))
  ).toFixed(2);

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="min-w-[400px] min-h-[200px] ">
        <div className="flex items-center justify-between mb-5 gap-2">
          <p className="text-2xl break-words">
            {amount.toFixed(2)} {inputToken}
          </p>
          <RightArrow />
          <p className="text-2xl break-words">
            {receivedAmount.toFixed(2)} {outputToken}
          </p>
        </div>
        <p>Execution:</p>
        <div className="overflow-y-auto custom-scrollbar max-h-[150px] text-[14px] mb-5">
          <p>Mint {(amount * mintFactor).toFixed(2)} outcome tokens</p>
          {quotes.map((quote, index) => {
            let {
              inputAmount: {
                raw: inputAmountRaw,
                currency: { decimals: inputDecimals, address: inputAddress, symbol: inputSymbol },
              },
              outputAmount: {
                currency: { symbol: outputSymbol },
              },
            } = quote.trade;
            inputSymbol = index !== quotes.length - 1 ? inputSymbol : collateral.symbol;
            outputSymbol = index === quotes.length - 1 ? outputSymbol : collateral.symbol;
            return (
              <p key={quote.buyToken}>
                Sell {Number(formatUnits(BigInt(inputAmountRaw.toString()), Number(inputDecimals))).toFixed(2)}{" "}
                {tokenAddressToSymbolMapping?.[inputAddress!.toLowerCase()] ?? inputSymbol} to{" "}
                {Number(formatUnits(quote.value, quote.decimals)).toFixed(2)} {outputSymbol}
              </p>
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          <p>Price</p>
          <p>
            {price} {inputToken}/{outputToken}{" "}
          </p>
        </div>
        <div className="flex items-center justify-between mb-5">
          <p>Minimum received</p>
          <p>
            {minimumReceive} {outputToken}
          </p>
        </div>
      </div>
      <Alert type="warning">
        Current slippage tolerance is {maximumSlippage}%. You will receive at least{" "}
        <span className="font-bold">
          {minimumReceive} {outputToken}
        </span>{" "}
        or the transaction will revert.
      </Alert>

      <div className="flex justify-center space-x-[24px] text-center mt-[32px]">
        <Button type="button" variant="secondary" text="Return" onClick={closeModal} />
        <Button variant="primary" type="submit" isLoading={isLoading} text="Continue" onClick={() => onSubmit()} />
      </div>
    </div>
  );
}
