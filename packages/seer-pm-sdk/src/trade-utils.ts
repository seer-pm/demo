import { Trade, TradeType, UniswapTrade } from "@swapr/sdk";
import type { Address, Hex } from "viem";
import { decodeFunctionData } from "viem";
import { UNISWAP_ROUTER_ABI } from "./execute-trade-abis";
import type { Psm3Leg } from "./quote";

export interface TradeTokensProps {
  trade: import("@swapr/sdk").CoWTrade | import("@swapr/sdk").SwaprV3Trade | UniswapTrade;
  account: Address;
  isBuyExactOutputNative: boolean;
  isSellToNative: boolean;
  isSeerCredits: boolean;
  psm3Leg?: Psm3Leg;
}

export function getMaximumAmountIn(trade: Trade): bigint {
  let maximumAmountIn = BigInt(trade.maximumAmountIn().raw.toString());
  if (trade instanceof UniswapTrade) {
    const callData = trade.swapRoute.methodParameters?.calldata;
    if (callData) {
      try {
        const decodedMulticall = decodeFunctionData({
          abi: UNISWAP_ROUTER_ABI,
          data: callData as Hex,
        });
        if (decodedMulticall.functionName === "multicall" && decodedMulticall.args?.[1]) {
          const innerData = (decodedMulticall.args[1] as readonly Hex[])[0];
          const decoded = decodeFunctionData({
            abi: UNISWAP_ROUTER_ABI,
            data: innerData,
          });
          if (decoded.args?.[0]) {
            const params = decoded.args[0] as {
              amountIn?: bigint;
              amountInMaximum?: bigint;
            };
            const callDataAmountIn =
              trade.tradeType === TradeType.EXACT_INPUT ? params.amountIn : params.amountInMaximum;
            if (callDataAmountIn && callDataAmountIn > maximumAmountIn) {
              maximumAmountIn = callDataAmountIn;
            }
          }
        }
      } catch {
        /* keep maximumAmountIn */
      }
    }
  }
  return maximumAmountIn;
}
