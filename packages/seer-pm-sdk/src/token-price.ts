/**
 * Token price from swap quotes (Lens AMM). Used for outcome token pricing when subgraph is not used.
 */

import type { Address, PublicClient } from "viem";
import { http, createPublicClient, formatUnits } from "viem";
import { base, gnosis, mainnet, optimism } from "viem/chains";
import { fetchAmmQuote } from "./quote";
import { getTokenPriceFromSubgraph } from "./subgraph";
import type { Token } from "./tokens";
import { TradeType } from "./trade-type";

const CHAIN_BY_ID = {
  [gnosis.id]: gnosis,
  [mainnet.id]: mainnet,
  [optimism.id]: optimism,
  [base.id]: base,
} as const;

function getPublicClientForChain(chainId: number): PublicClient {
  const chain = CHAIN_BY_ID[chainId as keyof typeof CHAIN_BY_ID];
  if (!chain) {
    throw new Error(`Unsupported chain for token price: ${chainId}`);
  }
  return createPublicClient({ chain, transport: http() }) as PublicClient;
}

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

  if (!CHAIN_BY_ID[chainId as keyof typeof CHAIN_BY_ID]) {
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
