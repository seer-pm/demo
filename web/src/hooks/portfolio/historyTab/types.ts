import { Address } from "viem";

export type TransactionType = "split" | "merge" | "redeem" | "swap" | "lp" | "lp-burn";

export interface TransactionData {
  marketName: string;
  marketId: string;
  type: TransactionType;
  blockNumber: number;
  collateral: Address;
  collateralSymbol?: string;
  timestamp?: number;
  transactionHash?: string;

  // split/mint/merge
  amount?: string;
  payout?: string;

  // swap
  tokenIn?: string;
  tokenOut?: string;
  tokenInSymbol?: string;
  tokenOutSymbol?: string;
  amountIn?: string;
  amountOut?: string;
  price?: string;

  //lp
  token0?: string;
  token1?: string;
  token0Symbol?: string;
  token1Symbol?: string;
  amount0?: string;
  amount1?: string;
}
