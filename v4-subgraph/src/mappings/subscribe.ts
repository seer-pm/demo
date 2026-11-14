import { Subscription as SubscriptionEvent } from '../types/PositionManager/PositionManager'
import { Position, Subscribe } from '../types/schema'
import { loadTransaction } from '../utils'
import { eventId, positionId } from '../utils/id'

// The subgraph handler must have this signature to be able to handle events,
// however, we invoke a helper in order to inject dependencies for unit tests.
export function handleSubscription(event: SubscriptionEvent): void {
  handleSubscriptionHelper(event)
}

export function handleSubscriptionHelper(event: SubscriptionEvent): void {
  // Only positions of indexed pools exist in the store; skip the rest.
  if (Position.load(positionId(event.params.tokenId)) === null) {
    return
  }

  const subscription = new Subscribe(eventId(event.transaction.hash, event.logIndex))

  const transaction = loadTransaction(event)

  subscription.tokenId = event.params.tokenId
  subscription.address = event.params.subscriber.toHexString()
  subscription.origin = event.transaction.from.toHexString()
  subscription.transaction = transaction.id
  subscription.logIndex = event.logIndex
  subscription.timestamp = transaction.timestamp
  subscription.position = positionId(event.params.tokenId)

  subscription.save()
}
