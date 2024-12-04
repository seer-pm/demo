import { Address, zeroAddress } from "viem";
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
