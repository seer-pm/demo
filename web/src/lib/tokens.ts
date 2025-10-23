import { DAI, WXDAI } from "@swapr/sdk";
import { Address, formatUnits, zeroAddress } from "viem";
import { SupportedChain, gnosis } from "./chains";
import { COLLATERAL_TOKENS } from "./config";
import { QuoteTradeResult } from "./trade";
import { NATIVE_TOKEN, isTwoStringsEqual, isUndefined } from "./utils";

export interface Token {
  address: Address;
  chainId: number;
  symbol: string;
  decimals: number;
  wrapped?: Token;
}

export const WRAPPED_OUTCOME_TOKEN_DECIMALS = 18;

export const EMPTY_TOKEN = {
  address: zeroAddress,
  chainId: 1,
  symbol: "",
  decimals: 18,
};

export const hasAltCollateral = (token: Token | undefined): token is Token => {
  return !isUndefined(token);
};

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

export function getCollateralTokenForSwap(tokenAddress: Address, chainId: SupportedChain) {
  if (
    isTwoStringsEqual(tokenAddress, WXDAI[chainId]?.address) ||
    isTwoStringsEqual(tokenAddress, DAI[chainId]?.address) ||
    isTwoStringsEqual(tokenAddress, NATIVE_TOKEN)
  ) {
    // return sDAI
    return COLLATERAL_TOKENS[chainId].primary.address;
  }

  return tokenAddress;
}

export function getCollateralSymbol(
  tokenAddress: Address,
  account: Address,
  owner: Address,
  chainId: SupportedChain,
  tokenIdToTokenSymbolMapping: Record<string, string> = {},
) {
  if (isTwoStringsEqual(tokenAddress, WXDAI[chainId]?.address)) {
    if (!isTwoStringsEqual(owner, account) && chainId === gnosis.id) {
      return "xDAI";
    }
    return WXDAI[chainId]?.symbol;
  }
  if (isTwoStringsEqual(tokenAddress, DAI[chainId]?.address)) {
    return DAI[chainId]?.symbol;
  }
  if (isTwoStringsEqual(tokenAddress, NATIVE_TOKEN) && chainId === gnosis.id) {
    return "xDAI";
  }
  if (isTwoStringsEqual(tokenAddress, COLLATERAL_TOKENS[chainId].primary.address)) {
    return COLLATERAL_TOKENS[chainId].primary.symbol;
  }

  return tokenIdToTokenSymbolMapping?.[tokenAddress.toLocaleLowerCase()];
}
