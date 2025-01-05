import { Address, zeroAddress } from "viem";
import { SupportedChain } from "./chains";
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
  const data = (await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`).then((res) => res.json())) as {
    pairs: { chainId: string; priceUsd: string }[];
  };
  const priceString = data.pairs.find((x) => x.chainId === { 1: "ethereum", 100: "gnosischain" }[chainId])?.priceUsd;
  return Number(priceString);
}
