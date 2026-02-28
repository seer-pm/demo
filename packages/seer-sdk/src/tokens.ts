/**
 * Token type and shared token constants/helpers.
 */

import type { Address } from "viem";
import { zeroAddress } from "viem";

export const NATIVE_TOKEN: Address = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export interface Token {
  address: Address;
  chainId: number;
  symbol: string;
  decimals: number;
  wrapped?: Token;
}

export type TokenTransfer = {
  id: string | number;
  chain_id: number;
  token: Address;
  tx_hash: string;
  block_number: number;
  timestamp: number;
  value: bigint;
  from: Address;
  to: Address;
};

export const WRAPPED_OUTCOME_TOKEN_DECIMALS = 18;

export const EMPTY_TOKEN: Token = {
  address: zeroAddress,
  chainId: 1,
  symbol: "",
  decimals: 18,
};
