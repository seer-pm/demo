import type { Address } from "viem";
import type { AmmTrade } from "./amm-trade";
import type { CompleteSetLeg } from "./complete-set-quote";
import type { Psm3Leg } from "./quote";
import { TradeType } from "./trade-type";

export interface TradeTokensProps {
  trade: AmmTrade;
  account: Address;
  isSeerCredits: boolean;
  psm3Leg?: Psm3Leg;
  completeSetLeg?: CompleteSetLeg;
}

export function getMaximumAmountIn(trade: AmmTrade): bigint {
  return trade.maximumAmountIn();
}

export function getMinimumAmountOut(trade: AmmTrade): bigint {
  return trade.minimumAmountOut();
}

export function getTradeAmountIn(trade: AmmTrade): bigint {
  return trade.amountIn;
}

export function getTradeAmountOut(trade: AmmTrade): bigint {
  return trade.amountOut;
}

export function getTradeTokenIn(trade: AmmTrade): {
  address: string;
  symbol: string | undefined;
  decimals: number;
} {
  return trade.tokenIn;
}

export function getTradeTokenOut(trade: AmmTrade): {
  address: string;
  symbol: string | undefined;
  decimals: number;
} {
  return trade.tokenOut;
}

export function getTradeApproveTokenAddress(trade: AmmTrade): Address {
  return getTradeTokenIn(trade).address as Address;
}

export { TradeType };
