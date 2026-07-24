import { CoWTrade } from "@swapr/sdk";
import type { Address } from "viem";
import type { AmmTrade } from "./amm-trade";
import type { CompleteSetLeg } from "./complete-set-quote";
import type { Psm3Leg } from "./quote";
import { TradeType } from "./trade-type";

export interface TradeTokensProps {
  trade: CoWTrade | AmmTrade;
  account: Address;
  isSeerCredits: boolean;
  psm3Leg?: Psm3Leg;
  completeSetLeg?: CompleteSetLeg;
}

export function isAmmTrade(trade: CoWTrade | AmmTrade): trade is AmmTrade {
  return !(trade instanceof CoWTrade);
}

export function getMaximumAmountIn(trade: CoWTrade | AmmTrade): bigint {
  if (isAmmTrade(trade)) {
    return trade.maximumAmountIn();
  }
  return BigInt(trade.maximumAmountIn().raw.toString());
}

export function getMinimumAmountOut(trade: CoWTrade | AmmTrade): bigint {
  if (isAmmTrade(trade)) {
    return trade.minimumAmountOut();
  }
  return BigInt(trade.minimumAmountOut().raw.toString());
}

export function getTradeAmountIn(trade: CoWTrade | AmmTrade): bigint {
  if (isAmmTrade(trade)) {
    return trade.amountIn;
  }
  return BigInt(trade.inputAmount.raw.toString());
}

export function getTradeAmountOut(trade: CoWTrade | AmmTrade): bigint {
  if (isAmmTrade(trade)) {
    return trade.amountOut;
  }
  return BigInt(trade.outputAmount.raw.toString());
}

export function getTradeTokenIn(trade: CoWTrade | AmmTrade): {
  address: string;
  symbol: string | undefined;
  decimals: number;
} {
  if (isAmmTrade(trade)) {
    return trade.tokenIn;
  }
  const currency = trade.inputAmount.currency;
  return {
    address: currency.address as string,
    symbol: currency.symbol,
    decimals: currency.decimals,
  };
}

export function getTradeTokenOut(trade: CoWTrade | AmmTrade): {
  address: string;
  symbol: string | undefined;
  decimals: number;
} {
  if (isAmmTrade(trade)) {
    return trade.tokenOut;
  }
  const currency = trade.outputAmount.currency;
  return {
    address: currency.address as string,
    symbol: currency.symbol,
    decimals: currency.decimals,
  };
}

export function getTradeApproveTokenAddress(trade: CoWTrade | AmmTrade): Address {
  return getTradeTokenIn(trade).address as Address;
}

export { TradeType };
