import { Address } from '@graphprotocol/graph-ts'

import { Transfer as TransferEvent } from '../types/PositionManager/PositionManager'
import { Position, Transfer } from '../types/schema'
import { loadTransaction } from '../utils'
import { eventId, positionId } from '../utils/id'

// The subgraph handler must have this signature to be able to handle events,
// however, we invoke a helper in order to inject dependencies for unit tests.
export function handleTransfer(event: TransferEvent): void {
  handleTransferHelper(event)
}

export function handleTransferHelper(event: TransferEvent): void {
  const tokenId = positionId(event.params.id)
  const from = event.params.from
  const to = event.params.to

  // Positions are created from ModifyLiquidity (which follows the mint Transfer in the
  // same transaction) and only for indexed pools, so unknown token ids are skipped here.
  const position = Position.load(tokenId)
  if (position === null) {
    return
  }

  position.owner = to.toHexString()
  if (to.equals(Address.zero())) {
    position.burned = true
  }

  const transaction = loadTransaction(event)

  const transfer = new Transfer(eventId(event.transaction.hash, event.logIndex))
  transfer.tokenId = event.params.id
  transfer.from = from.toHexString()
  transfer.to = to.toHexString()
  transfer.origin = event.transaction.from.toHexString()
  transfer.transaction = transaction.id
  transfer.logIndex = event.logIndex
  transfer.timestamp = transaction.timestamp
  transfer.position = position.id

  position.save()
  transfer.save()
}
