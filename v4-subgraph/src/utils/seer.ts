import { Address } from '@graphprotocol/graph-ts'

import { OutcomeToken } from '../types/schema'

/** True when the address is a wrapped outcome token of an indexed Seer market. */
export function isSeerOutcomeToken(address: Address): boolean {
  return OutcomeToken.load(address.toHexString()) !== null
}

/** True when at least one side of the pair is a Seer outcome token. */
export function isSeerPool(currency0: Address, currency1: Address): boolean {
  return isSeerOutcomeToken(currency0) || isSeerOutcomeToken(currency1)
}
