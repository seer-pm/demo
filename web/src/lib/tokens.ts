import { CoWTrade, DAI, WXDAI } from "@swapr/sdk";
import { Address, formatUnits, parseUnits, zeroAddress } from "viem";
import { SupportedChain, gnosis, sepolia } from "./chains";
import { COLLATERAL_TOKENS } from "./config";
import { QuoteTradeResult } from "./trade";
import { NATIVE_TOKEN, isTwoStringsEqual, isUndefined } from "./utils";

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

export async function getDexScreenerPriceUSD(token: Address, chainId: SupportedChain): Promise<number> {
  if (chainId === sepolia.id) {
    return 0;
  }
  const data = (await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`).then((res) => res.json())) as {
    pairs: { chainId: string; priceUsd: string }[];
  };
  const priceString = data.pairs?.find(
    (x) => x.chainId === { 1: "ethereum", 100: "gnosischain", 10: "optimism", 8453: "base" }[chainId],
  )?.priceUsd;
  return Number(priceString);
}

export function getSelectedCollateral(
  chainId: SupportedChain,
  useAltCollateral: boolean,
  isUseWrappedToken: boolean,
): Token {
  if (hasAltCollateral(COLLATERAL_TOKENS[chainId].secondary) && useAltCollateral) {
    if (isUseWrappedToken && COLLATERAL_TOKENS[chainId].secondary?.wrapped) {
      return COLLATERAL_TOKENS[chainId].secondary?.wrapped as Token;
    }

    return COLLATERAL_TOKENS[chainId].secondary as Token;
  }

  return COLLATERAL_TOKENS[chainId].primary;
}

export function getSharesInfo(
  swapType: "buy" | "sell",
  selectedCollateral: Token,
  quoteData: QuoteTradeResult | undefined,
  amount: string,
  receivedAmount: number,
  isCollateralDai: boolean,
  daiToSDai: number,
  sDaiToDai: number,
) {
  const collateralPerShare = getCollateralPerShare(
    swapType,
    selectedCollateral,
    quoteData,
    amount,
    receivedAmount,
    isCollateralDai,
    daiToSDai,
  );

  return { collateralPerShare, avgPrice: getSharesAvg(collateralPerShare, sDaiToDai, isCollateralDai) };
}

export function getCollateralPerShare(
  swapType: "buy" | "sell",
  selectedCollateral: Token,
  quoteData: QuoteTradeResult | undefined,
  amount: string,
  receivedAmount: number,
  isCollateralDai: boolean,
  daiToSDai: number,
) {
  if (!quoteData || !receivedAmount) {
    return 0;
  }

  const isCowSwapDai = isCollateralDai && quoteData?.trade instanceof CoWTrade;

  const cowSwapDaiAmount = isCowSwapDai
    ? swapType === "buy"
      ? parseUnits(amount, selectedCollateral.decimals)
      : (quoteData?.value ?? 0n)
    : 0n;
  const cowSwapSDaiAmount = cowSwapDaiAmount
    ? Number(formatUnits(cowSwapDaiAmount, selectedCollateral.decimals)) * daiToSDai
    : 0;

  const inputAmount = Number(
    formatUnits(BigInt(quoteData.trade.inputAmount.raw.toString()), quoteData.trade.inputAmount.currency.decimals),
  );

  if (swapType === "buy") {
    if (!isCowSwapDai) {
      return Number(inputAmount) / receivedAmount;
    }
    return cowSwapSDaiAmount / receivedAmount;
  }

  if (!isCowSwapDai) {
    return receivedAmount / Number(inputAmount);
  }
  return cowSwapSDaiAmount / Number(inputAmount);
}

function getSharesAvg(collateralPerShare: number, sDaiToDai: number, isCollateralDai: boolean) {
  return (isCollateralDai ? collateralPerShare * sDaiToDai : collateralPerShare).toFixed(3);
}

export function getPotentialReturn(
  collateralPerShare: number,
  returnPerToken: number,
  isCollateralDai: boolean,
  receivedAmount: number,
  sDaiToDai: number,
  isOneOrNothingPotentialReturn: boolean,
) {
  const returnPercentage = collateralPerShare ? (returnPerToken / collateralPerShare - 1) * 100 : 0;
  const potentialReturn =
    (isCollateralDai ? receivedAmount * sDaiToDai : receivedAmount) *
    (isOneOrNothingPotentialReturn ? 1 : returnPerToken);

  return { returnPercentage, potentialReturn };
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
