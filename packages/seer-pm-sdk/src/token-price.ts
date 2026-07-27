/**
 * Token price from swap quotes (Lens smart quoter). Used for outcome token pricing when subgraph is not used.
 */

import type { Address } from "viem";
import { formatUnits } from "viem";
import { getPublicClientForChain, isPublicClientChainSupported } from "./public-client";
import { fetchAmmQuote } from "./quote";
import { getTokenPriceFromSubgraph } from "./subgraph";
import type { Token } from "./tokens";
import { TradeType } from "./trade-type";

export async function getTokenPrice(wrappedAddress: Address, collateralToken: Token, chainId: number): Promise<number> {
  const priceFromSubgraph = await getTokenPriceFromSubgraph(wrappedAddress, collateralToken, chainId);
  if (Number.isNaN(priceFromSubgraph)) {
    return await getTokenPriceFromSwap(wrappedAddress, collateralToken, chainId);
  }
  return priceFromSubgraph;
}

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

  if (!isPublicClientChainSupported(chainId)) {
    return 0n;
  }

  try {
    const client = getPublicClientForChain(chainId);
    const quote = await fetchAmmQuote(
      client,
      TradeType.EXACT_INPUT,
      chainId,
      undefined,
      amount,
      outcomeToken,
      collateralToken,
      swapType,
      MAX_SLIPPAGE,
    );
    return quote.value;
  } catch {
    return 0n;
  }
}

export async function getTokenPriceFromSwap(
  wrappedAddress: Address,
  collateralToken: Token,
  chainId: number,
): Promise<number> {
  try {
    const price = await getTokenSwapResult(wrappedAddress, collateralToken, chainId, String(BUY_AMOUNT), "buy");
    if (price === 0n) {
      const sellPrice = await getTokenSwapResult(wrappedAddress, collateralToken, chainId, String(SELL_AMOUNT), "sell");
      return Number(formatUnits(sellPrice, collateralToken.decimals)) / SELL_AMOUNT;
    }
    return BUY_AMOUNT / Number(formatUnits(price, 18));
  } catch {
    return Number.NaN;
  }
}
