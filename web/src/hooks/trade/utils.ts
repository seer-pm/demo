import { COLLATERAL_TOKENS } from "@/lib/config";
import { Token as SwaprToken, SwaprV3Trade, TokenAmount, UniswapTrade } from "@swapr/sdk";
import { ethers } from "ethers";
import { TransactionReceipt } from "viem";
export function setSwaprTradeLimit(trade: SwaprV3Trade, newInputValue: bigint) {
  const sDAIAddress = COLLATERAL_TOKENS[trade.chainId].primary.address;
  if (BigInt(trade.inputAmount.raw.toString()) > newInputValue) {
    const newInputAmount = new TokenAmount(
      new SwaprToken(
        trade.chainId,
        trade.inputAmount.currency.address ?? sDAIAddress,
        trade.inputAmount.currency.decimals,
        trade.inputAmount.currency.symbol,
      ),
      newInputValue,
    );
    return new SwaprV3Trade({
      maximumSlippage: trade.maximumSlippage,
      inputAmount: newInputAmount,
      outputAmount: trade.outputAmount,
      tradeType: trade.tradeType,
      chainId: trade.chainId,
      priceImpact: trade.priceImpact,
      fee: trade.fee,
    });
  }
  return trade;
}

export async function setUniswapTradeLimit(trade: UniswapTrade, newInputValue: bigint, account: string) {
  const sDAIAddress = COLLATERAL_TOKENS[trade.chainId].primary.address;
  if (BigInt(trade.inputAmount.raw.toString()) > newInputValue) {
    const newInputAmount = new TokenAmount(
      new SwaprToken(
        trade.chainId,
        trade.inputAmount.currency.address ?? sDAIAddress,
        trade.inputAmount.currency.decimals,
        trade.inputAmount.currency.symbol,
      ),
      newInputValue,
    );
    const newQuoteTradeResult = await UniswapTrade.getQuote({
      amount: newInputAmount,
      quoteCurrency: trade.outputAmount.currency,
      maximumSlippage: trade.maximumSlippage,
      recipient: account,
      tradeType: trade.tradeType,
    });
    return newQuoteTradeResult ?? trade;
  }
  return trade;
}

export function getConvertedShares(receipt: TransactionReceipt) {
  try {
    const depositEventTopic = ethers.utils.id("Deposit(address,address,uint256,uint256)");
    const depositLog = receipt.logs.find((log) => log.topics[0] === depositEventTopic);
    if (depositLog) {
      const [_, shares] = new ethers.utils.AbiCoder().decode(["uint256", "uint256"], depositLog.data);
      return shares ? BigInt(shares) : undefined;
    }
  } catch (e) {}
}
