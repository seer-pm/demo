import { Address } from "viem";
import { isUndefined } from "./utils";

export interface Token {
  address: Address;
  symbol: string;
  decimals: number;
}

export const WRAPPED_OUTCOME_TOKEN_DECIMALS = 18;

export const hasAltCollateral = (token: Token | undefined): token is Token => {
  return !isUndefined(token);
};
