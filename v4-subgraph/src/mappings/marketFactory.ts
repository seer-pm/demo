import { Address, BigInt, log } from '@graphprotocol/graph-ts'

import { Market as MarketContract } from '../types/MarketFactory/Market'
import { NewMarket as NewMarketEvent } from '../types/MarketFactory/MarketFactory'
import { OutcomeToken, SeerMarket } from '../types/schema'

// The subgraph handler must have this signature to be able to handle events,
// however, we invoke a helper in order to inject dependencies for unit tests.
export function handleNewMarket(event: NewMarketEvent): void {
  handleNewMarketHelper(event)
}

/**
 * Registers a Seer market and its wrapped outcome tokens (including the Invalid outcome).
 * `NewMarket` does not carry the wrapped token addresses, so they are read from the
 * market contract: `wrappedOutcome(i)` for i in [0, numOutcomes] (numOutcomes excludes Invalid).
 * Pools are only indexed when one of their currencies is a known OutcomeToken.
 */
export function handleNewMarketHelper(event: NewMarketEvent): void {
  const marketAddress = event.params.market
  const marketId = marketAddress.toHexString()

  if (SeerMarket.load(marketId) !== null) {
    return
  }

  const market = new SeerMarket(marketId)
  market.marketName = event.params.marketName
  market.parentMarket = event.params.parentMarket
  market.conditionId = event.params.conditionId
  market.createdAtBlockNumber = event.block.number
  market.createdAtTimestamp = event.block.timestamp
  market.save()

  const contract = MarketContract.bind(marketAddress)
  const numOutcomesResult = contract.try_numOutcomes()
  if (numOutcomesResult.reverted) {
    log.warning('handleNewMarket: numOutcomes reverted for market {}', [marketId])
    return
  }

  // numOutcomes() excludes the Invalid outcome; wrappedOutcome(numOutcomes) is the Invalid token.
  const count = numOutcomesResult.value.toI32() + 1
  for (let i = 0; i < count; i++) {
    const wrappedResult = contract.try_wrappedOutcome(BigInt.fromI32(i))
    if (wrappedResult.reverted) {
      log.warning('handleNewMarket: wrappedOutcome({}) reverted for market {}', [i.toString(), marketId])
      continue
    }
    const tokenAddress: Address = wrappedResult.value.value0
    const tokenId = tokenAddress.toHexString()
    if (OutcomeToken.load(tokenId) !== null) {
      continue
    }
    const outcomeToken = new OutcomeToken(tokenId)
    outcomeToken.market = marketId
    outcomeToken.outcomeIndex = i
    outcomeToken.save()
  }
}
