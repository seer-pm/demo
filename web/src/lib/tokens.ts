import { Address, formatUnits, zeroAddress } from "viem";
import { SupportedChain, sepolia } from "./chains";
import { QuoteTradeResult } from "./trade";
import { isUndefined } from "./utils";

export interface Token {
  address: Address;
  symbol: string;
  decimals: number;
  wrapped?: Token;
}

export const WRAPPED_OUTCOME_TOKEN_DECIMALS = 18;

export const EMPTY_TOKEN = {
  address: zeroAddress,
  symbol: "",
  decimals: 18,
};

export const hasAltCollateral = (token: Token | undefined): token is Token => {
  return !isUndefined(token);
};

export async function getDexScreenerPriceUSD(token: Address, chainId: SupportedChain) {
  if (chainId === sepolia.id) {
    return 0;
  }
  const data = (await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`).then((res) => res.json())) as {
    pairs: { chainId: string; priceUsd: string }[];
  };
  const priceString = data.pairs?.find((x) => x.chainId === { 1: "ethereum", 100: "gnosischain" }[chainId])?.priceUsd;
  return Number(priceString);
}

export function getCollateralPerShare(quoteData: QuoteTradeResult | undefined, swapType: "buy" | "sell") {
  if (!quoteData) {
    return 0;
  }
  const inputAmount = Number(
    formatUnits(BigInt(quoteData.trade.inputAmount.raw.toString()), quoteData.trade.inputAmount.currency.decimals),
  );

  const outputAmount = Number(
    formatUnits(BigInt(quoteData.trade.outputAmount.raw.toString()), quoteData.trade.outputAmount.currency.decimals),
  );

  return swapType === "buy" ? inputAmount / outputAmount : outputAmount / inputAmount;
}
