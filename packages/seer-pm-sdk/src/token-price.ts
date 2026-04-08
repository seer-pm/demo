/**
 * Token price from swap quotes (Uniswap/Swapr). Used for outcome token pricing when subgraph is not used.
 */

import type { Address } from "viem";
import { formatUnits } from "viem";
import { gnosis, mainnet } from "viem/chains";
import { isOpStack } from "./chains";
import { getSwaprQuote, getUniswapQuote } from "./quote";
import { getTokenPriceFromSubgraph } from "./subgraph";
import type { Token } from "./tokens";

export async function getTokenPrice(
  wrappedAddress: Address,
  collateralToken: Token,
  chainId: number,
): Promise<number> {
  const priceFromSubgraph = getTokenPriceFromSubgraph(wrappedAddress, collateralToken, chainId);
  if(Number.isNaN(priceFromSubgraph)){
    return getTokenPriceFromSwap(wrappedAddress, collateralToken, chainId)
  }
  return priceFromSubgraph
}

const CEIL_PRICE = 1;
const BUY_AMOUNT = 3; // collateral token
const SELL_AMOUNT = 3; // outcome token
const MAX_SLIPPAGE = "1"; // 1%

export async function getTokenSwapResult(
  wrappedAddress: Address,
  collateralToken: Token,
  chainId: number,
  amount: string,
  swapType: "buy" | "sell",
): Promise<bigint> {
  const outcomeToken = {
    address: wrappedAddress,
    chainId,
    symbol: "SEER_OUTCOME",
    decimals: 18,
  };

  if (chainId === gnosis.id) {
    try {
      const swaprQuote = await getSwaprQuote(
        chainId,
        undefined,
        amount,
        outcomeToken,
        collateralToken,
        swapType,
        MAX_SLIPPAGE,
      );
      return swaprQuote.value;
    } catch {
      return 0n;
    }
  }

  if (chainId === mainnet.id || isOpStack(chainId)) {
    try {
      const uniswapQuote = await getUniswapQuote(
        chainId,
        undefined,
        amount,
        outcomeToken,
        collateralToken,
        swapType,
        MAX_SLIPPAGE,
      );
      return uniswapQuote.value;
    } catch {
      return 0n;
    }
  }

  return 0n;
}

export async function getTokenPriceFromSwap(
  wrappedAddress: Address,
  collateralToken: Token,
  chainId: number,
): Promise<number> {
  try {
    const price = await getTokenSwapResult(
      wrappedAddress,
      collateralToken,
      chainId,
      String(BUY_AMOUNT),
      "buy",
    );
    const pricePerShare = BUY_AMOUNT / Number(formatUnits(price, 18));
    if (pricePerShare > CEIL_PRICE) {
      const sellPrice = await getTokenSwapResult(
        wrappedAddress,
        collateralToken,
        chainId,
        String(SELL_AMOUNT),
        "sell",
      );
      const sellPricePerShare = Number(formatUnits(sellPrice, 18)) / SELL_AMOUNT;
      if (sellPricePerShare === 0 || sellPricePerShare > CEIL_PRICE) {
        return Number.NaN;
      }
      return sellPricePerShare;
    }
    return pricePerShare;
  } catch {
    return Number.NaN;
  }
}
